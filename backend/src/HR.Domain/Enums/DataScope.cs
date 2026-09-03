namespace HR.Domain.Enums;

public enum DataScope
{
    ALL = 1,             // Toàn công ty
    SITE = 2,            // Theo site (chi nhánh)
    DEPARTMENT_TREE = 3, // Theo sơ đồ phòng ban cấp dưới (đệ quy)
    DEPARTMENT = 4,      // Theo phòng ban trực tiếp
    OWN = 5              // Cá nhân (người tạo / người phụ trách)
}


