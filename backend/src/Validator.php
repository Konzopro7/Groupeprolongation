<?php

declare(strict_types=1);

function sanitizeString(?string $value, int $maxLength = 255): ?string
{
    if ($value === null) {
        return null;
    }

    $cleaned = trim(strip_tags($value));
    if ($cleaned === '') {
        return null;
    }

    if (mb_strlen($cleaned) > $maxLength) {
        $cleaned = mb_substr($cleaned, 0, $maxLength);
    }

    return $cleaned;
}

function parseBooleanNullable(mixed $value, string $fieldName, array &$errors): ?bool
{
    if ($value === null || $value === '') {
        return null;
    }

    if (is_bool($value)) {
        return $value;
    }

    if (is_int($value) || is_float($value)) {
        if ((int)$value === 1) {
            return true;
        }
        if ((int)$value === 0) {
            return false;
        }
    }

    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        if (in_array($normalized, ['1', 'true', 'yes', 'oui'], true)) {
            return true;
        }
        if (in_array($normalized, ['0', 'false', 'no', 'non'], true)) {
            return false;
        }
    }

    $errors[$fieldName] = 'Valeur booleenne invalide.';
    return null;
}

function isValidMediaReference(string $value): bool
{
    $trimmed = trim($value);
    if ($trimmed === '') {
        return false;
    }

    if (filter_var($trimmed, FILTER_VALIDATE_URL)) {
        $scheme = strtolower((string)parse_url($trimmed, PHP_URL_SCHEME));
        return in_array($scheme, ['http', 'https'], true);
    }

    // Accepte les chemins relatifs renvoyes par l API, ex: /api/uploads/xxx.jpg
    if (str_starts_with($trimmed, '/')) {
        if (strpos($trimmed, '..') !== false || strpos($trimmed, "\0") !== false) {
            return false;
        }
        return true;
    }

    return false;
}

function normalizeImages(mixed $input): array
{
    if ($input === null || $input === '') {
        return [];
    }

    $values = [];
    if (is_string($input)) {
        $decoded = json_decode($input, true);
        if (is_array($decoded)) {
            $values = $decoded;
        } else {
            $values = [$input];
        }
    } elseif (is_array($input)) {
        $values = $input;
    }

    $cleaned = [];
    foreach ($values as $item) {
        if (!is_string($item)) {
            continue;
        }
        $url = trim($item);
        if (isValidMediaReference($url)) {
            $cleaned[] = $url;
        }
    }

    return array_slice(array_values(array_unique($cleaned)), 0, 20);
}

function validateListingInput(array $input, bool $isUpdate = false): array
{
    $errors = [];
    $cleanData = [];
    $currentYear = (int)date('Y');

    $hasField = static fn(string $key): bool => array_key_exists($key, $input);
    $hasAnyField = static fn(array $keys): bool => count(array_filter(
        $keys,
        static fn(string $key): bool => array_key_exists($key, $input)
    )) > 0;

    if (!$isUpdate || $hasField('title')) {
        $title = sanitizeString((string)($input['title'] ?? ''), 180);
        if ($title === null || mb_strlen($title) < 3) {
            $errors['title'] = 'Le titre est obligatoire (minimum 3 caracteres).';
        } else {
            $cleanData['title'] = $title;
        }
    }

    if (!$isUpdate || $hasField('description')) {
        $description = sanitizeString((string)($input['description'] ?? ''), 5000);
        if ($description === null || mb_strlen($description) < 20) {
            $errors['description'] = 'La description est obligatoire (minimum 20 caracteres).';
        } else {
            $cleanData['description'] = $description;
        }
    }

    if (!$isUpdate || $hasField('price')) {
        $price = $input['price'] ?? null;
        if (!is_numeric($price) || (float)$price < 0) {
            $errors['price'] = 'Le prix doit etre un nombre positif.';
        } else {
            $cleanData['price'] = (float)$price;
        }
    }

    $categoryInput = $input['category_id'] ?? $input['categoryId'] ?? null;
    if (!$isUpdate || $categoryInput !== null) {
        if (!is_numeric($categoryInput) || (int)$categoryInput <= 0) {
            $errors['category_id'] = 'La categorie est obligatoire.';
        } else {
            $cleanData['category_id'] = (int)$categoryInput;
        }
    }

    if ($hasField('fuel')) {
        $fuel = sanitizeString((string)$input['fuel'], 60);
        $cleanData['fuel'] = $fuel;
    } elseif (!$isUpdate) {
        $cleanData['fuel'] = null;
    }

    if ($hasField('transmission')) {
        $cleanData['transmission'] = sanitizeString((string)$input['transmission'], 60);
    } elseif (!$isUpdate) {
        $cleanData['transmission'] = null;
    }

    if ($hasAnyField(['interior_color', 'interiorColor'])) {
        $interiorColorInput = $input['interior_color'] ?? $input['interiorColor'] ?? null;
        $cleanData['interior_color'] = sanitizeString((string)$interiorColorInput, 60);
    } elseif (!$isUpdate) {
        $cleanData['interior_color'] = null;
    }

    if ($hasAnyField(['exterior_color', 'exteriorColor'])) {
        $exteriorColorInput = $input['exterior_color'] ?? $input['exteriorColor'] ?? null;
        $cleanData['exterior_color'] = sanitizeString((string)$exteriorColorInput, 60);
    } elseif (!$isUpdate) {
        $cleanData['exterior_color'] = null;
    }

    if (!$isUpdate || $hasAnyField(['delivery'])) {
        $deliveryInput = $input['delivery'] ?? null;
        $cleanData['delivery'] = parseBooleanNullable($deliveryInput, 'delivery', $errors);
    }

    if (!$isUpdate || $hasAnyField(['export_available', 'exportAvailable'])) {
        $exportInput = $input['export_available'] ?? $input['exportAvailable'] ?? null;
        $cleanData['export_available'] = parseBooleanNullable($exportInput, 'export_available', $errors);
    }

    if ($hasField('status')) {
        $cleanData['status'] = sanitizeString((string)$input['status'], 40);
    } elseif (!$isUpdate) {
        $cleanData['status'] = 'Disponible';
    }

    if ($hasField('mileage')) {
        $mileage = $input['mileage'];
        if ($mileage === null || $mileage === '') {
            $cleanData['mileage'] = null;
        } elseif (!is_numeric($mileage) || (int)$mileage < 0) {
            $errors['mileage'] = 'Le kilometrage doit etre un nombre positif.';
        } else {
            $cleanData['mileage'] = (int)$mileage;
        }
    } elseif (!$isUpdate) {
        $cleanData['mileage'] = null;
    }

    if ($hasField('year')) {
        $year = $input['year'];
        if ($year === null || $year === '') {
            $cleanData['year'] = null;
        } elseif (!is_numeric($year) || (int)$year < 1950 || (int)$year > $currentYear + 1) {
            $errors['year'] = 'L annee est invalide.';
        } else {
            $cleanData['year'] = (int)$year;
        }
    } elseif (!$isUpdate) {
        $cleanData['year'] = null;
    }

    if ($hasField('location')) {
        $cleanData['location'] = sanitizeString((string)$input['location'], 160);
    } elseif (!$isUpdate) {
        $cleanData['location'] = null;
    }

    if (!$isUpdate || $hasAnyField(['negotiable'])) {
        $negotiableInput = $input['negotiable'] ?? null;
        $cleanData['negotiable'] = parseBooleanNullable($negotiableInput, 'negotiable', $errors);
    }

    if (!$isUpdate || $hasAnyField(['phone'])) {
        $phone = sanitizeString((string)($input['phone'] ?? ''), 50);
        if ($phone === null || mb_strlen($phone) < 8) {
            $errors['phone'] = 'Le telephone est obligatoire (minimum 8 caracteres).';
        } else {
            $cleanData['phone'] = $phone;
        }
    }

    if (!$isUpdate || $hasAnyField(['city'])) {
        $city = sanitizeString((string)($input['city'] ?? ''), 120);
        if ($city === null || mb_strlen($city) < 2) {
            $errors['city'] = 'La ville est obligatoire.';
        } else {
            $cleanData['city'] = $city;
            if (empty($cleanData['location'])) {
                $cleanData['location'] = $city;
            }
        }
    }

    if ($hasAnyField(['item_state', 'itemState'])) {
        $itemStateInput = $input['item_state'] ?? $input['itemState'] ?? null;
        $cleanData['item_state'] = sanitizeString((string)$itemStateInput, 60);
    } elseif (!$isUpdate) {
        $cleanData['item_state'] = null;
    }

    if (!$isUpdate || $hasAnyField(['price_currency', 'priceCurrency'])) {
        $currencyInput = strtoupper(trim((string)($input['price_currency'] ?? $input['priceCurrency'] ?? 'XAF')));
        if ($currencyInput === '') {
            $currencyInput = 'XAF';
        }
        if (!preg_match('/^[A-Z]{3}$/', $currencyInput)) {
            $errors['price_currency'] = 'Code devise invalide (ex: XAF).';
        } else {
            $cleanData['price_currency'] = $currencyInput;
        }
    }

    return ['errors' => $errors, 'data' => $cleanData];
}

function validateContactInput(array $input): array
{
    $errors = [];
    $data = [];

    $name = sanitizeString((string)($input['name'] ?? ''), 120);
    if ($name === null || mb_strlen($name) < 2) {
        $errors['name'] = 'Le nom est obligatoire.';
    } else {
        $data['name'] = $name;
    }

    $email = sanitizeString((string)($input['email'] ?? ''), 180);
    if ($email === null || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Adresse email invalide.';
    } else {
        $data['email'] = $email;
    }

    $message = sanitizeString((string)($input['message'] ?? ''), 4000);
    if ($message === null || mb_strlen($message) < 10) {
        $errors['message'] = 'Le message est obligatoire (minimum 10 caracteres).';
    } else {
        $data['message'] = $message;
    }

    return ['errors' => $errors, 'data' => $data];
}
