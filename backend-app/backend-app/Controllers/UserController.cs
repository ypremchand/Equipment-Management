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

                // Required fields
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

                // Strong password check
                var strongPassword = System.Text.RegularExpressions.Regex.IsMatch(
                    model.Password,
                    @"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$");

                if (!strongPassword)
                    return BadRequest(new { message = "Weak password" });

                // ❗ Check if already exists in User or Admin table
                if (await _context.Users.AnyAsync(u => u.Email == model.Email) ||
                    await _context.Admins.AnyAsync(a => a.Email == model.Email))
                {
                    return BadRequest(new { message = "Email already registered." });
                }

                // IF EMAIL CONTAINS ADMIN → REGISTER AS ADMIN
                if (model.Email.ToLower().Contains("@admin"))
                {
                    var admin = new Admin
                    {
                        Name = model.Name,
                        Email = model.Email,
                        PhoneNumber=model.PhoneNumber,
                        Password = HashPassword(model.Password)
                    };

                    _context.Admins.Add(admin);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Admin registered successfully." });
                }

                // OTHERWISE REGISTER AS NORMAL USER
                var user = new User
                {
                    Name = model.Name,
                    Email = model.Email,
                    PhoneNumber = model.PhoneNumber,
                    Password = HashPassword(model.Password)
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User registered successfully." });
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

            var hashedPwd = HashPassword(login.Password);

            // Check Admin first
            var admin = await _context.Admins
                .FirstOrDefaultAsync(a => a.Email == login.Email && a.Password == hashedPwd);

            if (admin != null)
            {
                return Ok(new
                {
                    message = "Admin login successful",
                    role = "Admin",
                    user = new { admin.Id, admin.Name, admin.Email }
                });
            }

            // Check User table
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == login.Email && u.Password == hashedPwd);

            if (user != null)
            {
                return Ok(new
                {
                    message = "User login successful",
                    role = "User",
                    user = new { user.Id, user.Name, user.Email, user.PhoneNumber }
                });
            }

            return Unauthorized(new { message = "Invalid login credentials" });
        }



        // ✅ Hash password using SHA256
        private static string HashPassword(string password)
        {
            var bytes = Encoding.UTF8.GetBytes(password);
            return Convert.ToBase64String(SHA256.HashData(bytes));
        }

        // GET: api/user
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.PhoneNumber
                })
                .ToListAsync();

            return Ok(users);
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
