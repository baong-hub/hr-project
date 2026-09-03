using Microsoft.Extensions.DependencyInjection;
using MediatR;
using FluentValidation;
using HR.Application.Common.Behaviors;
using System.Reflection;

namespace HR.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddValidatorsFromAssembly(assembly);
        
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ActivityLogBehavior<,>));
        });



        // Register Mapster mappings
        var config = Mapster.TypeAdapterConfig.GlobalSettings;
        var mappingTypes = assembly.GetExportedTypes()
            .Where(t => t.GetMethods().Any(m => 
                m.Name == "Mapping" && 
                m.GetParameters().Length == 1 && 
                m.GetParameters()[0].ParameterType == typeof(Mapster.TypeAdapterConfig)))
            .ToList();

        foreach (var type in mappingTypes)
        {
            try
            {
                var instance = Activator.CreateInstance(type);
                var methodInfo = type.GetMethod("Mapping", new[] { typeof(Mapster.TypeAdapterConfig) });
                methodInfo?.Invoke(instance, new object[] { config });
            }
            catch
            {
                // Ignore types that cannot be instantiated
            }
        }

        return services;
    }
}

