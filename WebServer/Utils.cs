using System;


public static class Utils
{
    public static string[] ParseStringToArray(string input)
    {
        if (string.IsNullOrEmpty(input))
            return Array.Empty<string>();

        // Разделяем по запятой и удаляем лишние пробелы
        return input.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim())
                    .ToArray();
    }
}
