using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace HR.Application.Common.Helpers;

public static class AudioConverter
{
    private static readonly string FfmpegPath = GetFfmpegPath();

    private static string GetFfmpegPath()
    {
        // 1. Kiểm tra trong thư mục tools của project
        var baseDir = Directory.GetCurrentDirectory();
        var localToolsFfmpeg = Path.Combine(baseDir, "tools", "ffmpeg.exe");
        if (File.Exists(localToolsFfmpeg))
        {
            return localToolsFfmpeg;
        }

        // Thử tìm trong AppContext.BaseDirectory/tools/ffmpeg.exe
        var appBaseFfmpeg = Path.Combine(AppContext.BaseDirectory, "tools", "ffmpeg.exe");
        if (File.Exists(appBaseFfmpeg))
        {
            return appBaseFfmpeg;
        }

        // 2. Fallback tìm trong PATH (cho cả Windows, Linux, Mac)
        var isWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
        var ffmpegBinaryName = isWindows ? "ffmpeg.exe" : "ffmpeg";
        
        return ffmpegBinaryName;
    }

    public static async Task<bool> ConvertToMp3Async(string inputPath, string outputPath)
    {
        if (!File.Exists(inputPath))
        {
            Console.WriteLine($"[AudioConverter] File đầu vào không tồn tại: {inputPath}");
            return false;
        }

        try
        {
            var outputDir = Path.GetDirectoryName(outputPath);
            if (!string.IsNullOrEmpty(outputDir) && !Directory.Exists(outputDir))
            {
                Directory.CreateDirectory(outputDir);
            }

            // Đối số convert sang MP3 128kbps chuẩn
            var arguments = $"-y -i \"{inputPath}\" -codec:a libmp3lame -b:a 128k \"{outputPath}\"";

            var startInfo = new ProcessStartInfo
            {
                FileName = FfmpegPath,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = startInfo };
            
            Console.WriteLine($"[AudioConverter] Bắt đầu convert FFmpeg: {FfmpegPath} {arguments}");
            process.Start();

            var errorTask = process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();
            
            var errorLog = await errorTask;
            
            if (process.ExitCode == 0)
            {
                Console.WriteLine($"[AudioConverter] Chuyển đổi thành công: {inputPath} -> {outputPath}");
                return true;
            }
            else
            {
                Console.WriteLine($"[AudioConverter] FFmpeg lỗi (ExitCode: {process.ExitCode}). Log: {errorLog}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AudioConverter] Lỗi khi chuyển đổi file ghi âm: {ex.Message}");
            return false;
        }
    }
}

