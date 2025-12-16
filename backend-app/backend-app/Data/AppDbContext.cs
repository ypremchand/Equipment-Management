using backend_app.Models;
//using EquipmentDispatchManagement.Models;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<Laptop> Laptops { get; set; }
        public DbSet<Mobile> Mobiles { get; set; }
        public DbSet<Tablet> Tablets { get; set; }
        public DbSet<Desktop> Desktops { get; set; }
        public DbSet<Printer> Printers { get; set; }
        public DbSet<Scanner1> Scanner1 { get; set; }
        public DbSet<Scanner2> Scanner2 { get; set; }
        public DbSet<Scanner3> Scanner3 { get; set; }


        public DbSet<DamagedAsset> DamagedAssets { get; set; }
        public DbSet<RepairHistory> RepairHistories { get; set; }

        public DbSet<Location> Locations { get; set; }
        public DbSet<AssignedAsset> AssignedAssets { get; set; }
        public DbSet<AssetRequest> AssetRequests { get; set; }
        public DbSet<AssetRequestItem> AssetRequestItems { get; set; }

        public DbSet<AdminDeleteHistory> AdminDeleteHistories { get; set; }
        public DbSet<UserDeleteHistory> UserDeleteHistories { get; set; }
        public DbSet<AssetHistory> AssetHistories { get; set; }


    }
}
