using System.Security.Cryptography;
using System.Text;
using HR.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace HR.Infrastructure.Security;

public class EncryptionService : IEncryptionService
{
    private readonly byte[] _key;
    private const int KeySize = 32; // 256 bits

    public EncryptionService(IConfiguration configuration)
    {
        var configuredKey = configuration["Security:EncryptionKey"];
        var keyString = (!string.IsNullOrEmpty(configuredKey) ? configuredKey : configuration["ENCRYPTION_KEY"])
                        ?? "dev_f83f4899d91b4237350474b5c921a4757a87d06679ec37143b56ad6a4ded97d9";
        
        // Ensure key is 32 bytes
        var keyBytes = Encoding.UTF8.GetBytes(keyString);
        _key = new byte[KeySize];
        Array.Copy(keyBytes, _key, Math.Min(keyBytes.Length, KeySize));
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV();
        var iv = aes.IV;

        using var encryptor = aes.CreateEncryptor(aes.Key, iv);
        using var ms = new MemoryStream();
        
        // Write IV to the beginning of the stream
        ms.Write(iv, 0, iv.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;

        try
        {
            var fullCipher = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = _key;

            var iv = new byte[aes.BlockSize / 8];
            var cipher = new byte[fullCipher.Length - iv.Length];

            Array.Copy(fullCipher, 0, iv, 0, iv.Length);
            Array.Copy(fullCipher, iv.Length, cipher, 0, cipher.Length);

            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(cipher);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);
            
            return sr.ReadToEnd();
        }
        catch
        {
            // If decryption fails, return the cipherText (it might be already masked or invalid)
            return cipherText;
        }
    }
}

