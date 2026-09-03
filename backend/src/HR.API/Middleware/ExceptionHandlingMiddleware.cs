using System.Net;
using System.Text.Json;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Models;

namespace HR.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception has occurred.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static string GetLanguage(HttpContext context)
    {
        var lang = context.Request.Headers["Accept-Language"].ToString();
        if (string.IsNullOrEmpty(lang)) return "vi";
        lang = lang.Split(',')[0].Split(';')[0].Trim().ToLower();
        return lang.StartsWith("en") ? "en" : "vi";
    }

    private static string TranslateMessage(string msg, string lang)
    {
        if (lang != "en") return msg;

        var translations = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // Core errors
            { "An unexpected error occurred.", "An unexpected error occurred." },
            { "Có lỗi xảy ra trên hệ thống.", "An unexpected error occurred." },
            { "Dữ liệu không hợp lệ.", "Validation failed." },
            { "Bạn không có quyền thực hiện hành động này.", "You do not have permission to perform this action." },
            
            // Customer Validation / Business errors
            { "Số điện thoại khách hàng hoặc người thân là bắt buộc", "Customer or relative phone number is required" },
            { "Số điện thoại không hợp lệ (từ 7 đến 15 chữ số, hỗ trợ mã quốc tế)", "Invalid phone number (7 to 15 digits, supports international format)" },
            { "Số điện thoại người thân không hợp lệ (từ 7 đến 15 chữ số, hỗ trợ mã quốc tế)", "Invalid relative phone number (7 to 15 digits, supports international format)" },
            { "Email không hợp lệ", "Invalid email address" },
            { "Vui lòng chọn giới tính", "Please select gender" },
            { "Nguồn đến là bắt buộc", "Source is required" },
            { "Nguồn giới thiệu là bắt buộc", "Referral source is required" },
            { "Vui lòng chọn nhân viên liên kết", "Please select linked employee" },
            { "Số điện thoại đã tồn tại trong hệ thống", "Phone number already exists in the system" },
            { "Khách hàng đang có chỉ định cận lâm sàng chưa thực hiện. Bạn có muốn cập nhật thông tin?", "This customer has pending laboratory executions. Do you want to update them?" },
            
            // New Customer & Appointment & Reception errors
            { "Bạn không có quyền thao tác tại chi nhánh này.", "You do not have permission to operate in this branch." },
            { "Mã khách hàng đã tồn tại trên hệ thống.", "Customer code already exists in the system." },
            { "Số điện thoại đã tồn tại trên hệ thống.", "Phone number already exists in the system." },
            { "Email đã tồn tại trên hệ thống.", "Email already exists in the system." },
            { "Bạn không có quyền thao tác khách hàng thuộc chi nhánh này.", "You do not have permission to operate on customers of this branch." },
            { "Khách hàng này có phiếu xét nghiệm đang chờ thực hiện. Bạn có muốn cập nhật lại khoảng tham chiếu của kết quả xét nghiệm theo giới tính mới không?", "This customer has pending laboratory executions. Do you want to update the reference ranges of the test results according to the new gender?" },
            { "Họ tên không được để trống", "Full name cannot be empty" },
            { "Họ tên tối đa 255 ký tự", "Full name can be at most 255 characters" },
            { "Giới tính không hợp lệ", "Invalid gender" },
            { "Số điện thoại không hợp lệ", "Invalid phone number" },
            { "Mã khách hàng tối đa 50 ký tự", "Customer code can be at most 50 characters" },
            { "Nhân viên liên kết là bắt buộc đối với loại khách hàng này", "Linked staff is required for this customer type" },
            { "ID không hợp lệ", "Invalid ID" },
            { "Mã khách hàng không được để trống", "Customer code cannot be empty" },
            { "Mã khách hàng không được để trống.", "Customer code cannot be empty." },
            { "Vui lòng chọn ít nhất một dịch vụ.", "Please select at least one service." },
            { "Thời gian bắt đầu không được để trống.", "Start time cannot be empty." },
            { "Thời gian kết thúc không được để trống.", "End time cannot be empty." },
            { "Nội dung không được để trống.", "Content cannot be empty." },
            { "Số lượng phải lớn hơn 0.", "Quantity must be greater than 0." },
            { "Vui lòng chọn hoặc nhập lý do tư vấn thất bại.", "Please select or enter the reason for consultation failure." }
        };

        return translations.TryGetValue(msg, out var translated) ? translated : msg;
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var lang = GetLanguage(context);
        var code = HttpStatusCode.InternalServerError;
        var defaultMsg = lang == "en" ? "An unexpected error occurred." : "Có lỗi xảy ra trên hệ thống.";
        var result = ApiResponse<object>.Fail("SERVER_ERROR", defaultMsg);

        // Bổ sung chi tiết lỗi để debug (trong môi trường dev)
        var errorDetails = new List<ApiErrorDetail>
        {
            new ApiErrorDetail { Field = "Exception", Message = TranslateMessage(exception.Message, lang) },
            new ApiErrorDetail { Field = "StackTrace", Message = exception.StackTrace ?? "" }
        };

        if (exception.InnerException != null)
        {
            errorDetails.Add(new ApiErrorDetail { Field = "InnerException", Message = TranslateMessage(exception.InnerException.Message, lang) });
        }
        
        result.Error!.Details = errorDetails;

        switch (exception)
        {
            case HR.Application.Common.Exceptions.ValidationException validationException:
                code = HttpStatusCode.BadRequest;
                var details = validationException.Errors.SelectMany(x => x.Value.Select(v => new ApiErrorDetail 
                { 
                    Field = x.Key, 
                    Message = TranslateMessage(v, lang) 
                })).ToList();
                
                var valMsg = lang == "en" ? "Validation failed." : "Dữ liệu không hợp lệ.";
                result = ApiResponse<object>.Fail("VALIDATION_FAILED", valMsg, details);
                break;
            case NotFoundException notFoundException:
                code = HttpStatusCode.NotFound;
                result = ApiResponse<object>.Fail(notFoundException.Code, TranslateMessage(notFoundException.Message, lang));
                break;
            case ConflictException conflictException:
                code = HttpStatusCode.Conflict;
                result = ApiResponse<object>.Fail(conflictException.Code, TranslateMessage(conflictException.Message, lang));
                break;
            case BadRequestException badRequestException:
                code = HttpStatusCode.BadRequest;
                result = ApiResponse<object>.Fail(badRequestException.Code, TranslateMessage(badRequestException.Message, lang));
                break;
            case ForbiddenException forbiddenException:
                code = HttpStatusCode.Forbidden;
                var forbiddenMsg = lang == "en" ? "You do not have permission to perform this action." : forbiddenException.Message;
                result = ApiResponse<object>.Fail("FORBIDDEN", TranslateMessage(forbiddenMsg, lang));
                break;
            case UnauthorizedException unauthorizedException:
                code = HttpStatusCode.Unauthorized;
                result = ApiResponse<object>.Fail(unauthorizedException.Code, TranslateMessage(unauthorizedException.Message, lang));
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;

        return context.Response.WriteAsync(JsonSerializer.Serialize(result, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}

