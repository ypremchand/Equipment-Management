using Microsoft.EntityFrameworkCore;
using backend_app.Models;

namespace backend_app.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Asset> Assets { get; set; }
        public DbSet<Laptop> Laptops { get; set; }
        public DbSet<Mobile> Mobiles { get; set; }
        public DbSet<Tablet> Tablets { get; set; }
        public DbSet<Location> Locations { get; set; }

    }
}
