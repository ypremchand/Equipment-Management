using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            try
            {
                if (model == null)
                    return BadRequest(new { message = "Invalid request." });

                if (string.IsNullOrWhiteSpace(model.Name) ||
                    string.IsNullOrWhiteSpace(model.Email) ||
                    string.IsNullOrWhiteSpace(model.PhoneNumber) ||
                    string.IsNullOrWhiteSpace(model.Password) ||
                    string.IsNullOrWhiteSpace(model.ConfirmPassword))
                {
                    return BadRequest(new { message = "All fields are required." });
                }

                if (model.Password != model.ConfirmPassword)
                    return BadRequest(new { message = "Passwords do not match." });

                // Password strength validation
                var strongPassword =
                    System.Text.RegularExpressions.Regex.IsMatch(
                        model.Password,
                        @"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$");

                if (!strongPassword)
                    return BadRequest(new { message = "Password must contain at least 1 letter, 1 number, 1 special character and be 8+ characters long." });

                if (await _context.Users.AnyAsync(u => u.Email == model.Email))
                    return BadRequest(new { message = "Email already registered." });

                if (await _context.Users.AnyAsync(u => u.PhoneNumber == model.PhoneNumber))
                    return BadRequest(new { message = "Phone number already registered." });

                var user = new User
                {
                    Name = model.Name,
                    Email = model.Email,
                    PhoneNumber = model.PhoneNumber,
                    Password = HashPassword(model.Password)
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Registration successful." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal server error",
                    error = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }




        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel login)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == login.Email);
            if (user == null || user.Password != HashPassword(login.Password))
                return Unauthorized(new { message = "Invalid email or password" });

            return Ok(new
            {
                message = "Login successful",
                user = new { user.Id, user.Name, user.Email,user.PhoneNumber }
            });
        }


        // ✅ Hash password using SHA256
        private static string HashPassword(string password)
        {
            var bytes = Encoding.UTF8.GetBytes(password);
            return Convert.ToBase64String(SHA256.HashData(bytes));
        }
        public class RegisterDto
        {
            public string Name { get; set; } = "";
            public string Email { get; set; } = "";
            public string PhoneNumber { get; set; } = "";
            public string Password { get; set; } = "";
            public string ConfirmPassword { get; set; } = "";
        }

    }
}
