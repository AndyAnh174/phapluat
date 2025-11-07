# Test API Script for HCMUTE Exam System
$baseUrl = "http://localhost:3001"
$adminToken = ""

Write-Host "=== Testing HCMUTE Exam System API ===" -ForegroundColor Cyan
Write-Host ""

# 1. Test Admin Login
Write-Host "1. Testing Admin Login..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/admin/login" -Method POST -Body $loginBody -ContentType "application/json"
    $adminToken = $loginResponse.accessToken
    Write-Host "OK Admin login successful!" -ForegroundColor Green
    Write-Host "  Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "FAIL Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Test Admin Profile
Write-Host "2. Testing Admin Profile..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $profile = Invoke-RestMethod -Uri "$baseUrl/auth/admin/me" -Method GET -Headers $headers
    Write-Host "OK Admin profile retrieved!" -ForegroundColor Green
    Write-Host "  Username: $($profile.username)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Admin profile failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Test Create Exam Set
Write-Host "3. Testing Create Exam Set..." -ForegroundColor Yellow
$examSetBody = @{
    name = "Test Exam Set 1"
    description = "This is a test exam set"
    durationMinutes = 60
} | ConvertTo-Json

try {
    $examSet = Invoke-RestMethod -Uri "$baseUrl/admin/exam-sets" -Method POST -Body $examSetBody -ContentType "application/json" -Headers $headers
    $examSetId = $examSet._id
    Write-Host "OK Exam set created!" -ForegroundColor Green
    Write-Host "  ID: $examSetId" -ForegroundColor Gray
    Write-Host "  Name: $($examSet.name)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Create exam set failed: $($_.Exception.Message)" -ForegroundColor Red
    $examSetId = $null
}
Write-Host ""

# 4. Test Get Exam Sets
Write-Host "4. Testing Get Exam Sets..." -ForegroundColor Yellow
try {
    $examSets = Invoke-RestMethod -Uri "$baseUrl/admin/exam-sets" -Method GET -Headers $headers
    Write-Host "OK Retrieved exam sets!" -ForegroundColor Green
    Write-Host "  Total: $($examSets.total)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Get exam sets failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Test Create Questions
if ($examSetId) {
    Write-Host "5. Testing Create Questions..." -ForegroundColor Yellow
    $questionBody = @{
        content = "What is 2 + 2?"
        options = @{
            A = "3"
            B = "4"
            C = "5"
            D = "6"
        }
        correctAnswer = "B"
        order = 1
    } | ConvertTo-Json

    try {
        $question = Invoke-RestMethod -Uri "$baseUrl/admin/exam-sets/$examSetId/questions" -Method POST -Body $questionBody -ContentType "application/json" -Headers $headers
        $questionId = $question._id
        Write-Host "OK Question created!" -ForegroundColor Green
        Write-Host "  ID: $questionId" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Create question failed: $($_.Exception.Message)" -ForegroundColor Red
        $questionId = $null
    }
    Write-Host ""

    # Create second question
    $question2Body = @{
        content = "What is the capital of Vietnam?"
        options = @{
            A = "Ho Chi Minh City"
            B = "Hanoi"
            C = "Da Nang"
            D = "Hue"
        }
        correctAnswer = "B"
        order = 2
    } | ConvertTo-Json

    try {
        $question2 = Invoke-RestMethod -Uri "$baseUrl/admin/exam-sets/$examSetId/questions" -Method POST -Body $question2Body -ContentType "application/json" -Headers $headers
        Write-Host "OK Second question created!" -ForegroundColor Green
    } catch {
        Write-Host "FAIL Create second question failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # 6. Test Get Questions
    Write-Host "6. Testing Get Questions..." -ForegroundColor Yellow
    try {
        $questions = Invoke-RestMethod -Uri "$baseUrl/admin/exam-sets/$examSetId/questions" -Method GET -Headers $headers
        Write-Host "OK Retrieved questions!" -ForegroundColor Green
        Write-Host "  Count: $($questions.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Get questions failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # 7. Test Activate Exam
    Write-Host "7. Testing Activate Exam..." -ForegroundColor Yellow
    $activateBody = @{
        examSetId = $examSetId
    } | ConvertTo-Json

    try {
        $activated = Invoke-RestMethod -Uri "$baseUrl/admin/exam/activate" -Method POST -Body $activateBody -ContentType "application/json" -Headers $headers
        Write-Host "OK Exam activated!" -ForegroundColor Green
    } catch {
        Write-Host "FAIL Activate exam failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # 8. Test Get Exam Status
    Write-Host "8. Testing Get Exam Status..." -ForegroundColor Yellow
    try {
        $status = Invoke-RestMethod -Uri "$baseUrl/admin/exam/status" -Method GET -Headers $headers
        Write-Host "OK Exam status retrieved!" -ForegroundColor Green
        Write-Host "  Is Active: $($status.isActive)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Get exam status failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # 9. Test Get Exam Set by ID
    Write-Host "9. Testing Get Exam Set by ID..." -ForegroundColor Yellow
    try {
        $examSetDetail = Invoke-RestMethod -Uri "$baseUrl/admin/exam-sets/$examSetId" -Method GET -Headers $headers
        Write-Host "OK Exam set detail retrieved!" -ForegroundColor Green
        Write-Host "  Name: $($examSetDetail.name)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Get exam set detail failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # 10. Test Update Question
    if ($questionId) {
        Write-Host "10. Testing Update Question..." -ForegroundColor Yellow
        $updateQuestionBody = @{
            content = "Updated: What is 2 + 2?"
        } | ConvertTo-Json

        try {
            $updatedQuestion = Invoke-RestMethod -Uri "$baseUrl/admin/questions/$questionId" -Method PATCH -Body $updateQuestionBody -ContentType "application/json" -Headers $headers
            Write-Host "OK Question updated!" -ForegroundColor Green
            Write-Host "  New content: $($updatedQuestion.content)" -ForegroundColor Gray
        } catch {
            Write-Host "FAIL Update question failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
    }

    # 11. Test Duplicate Exam Set
    Write-Host "11. Testing Duplicate Exam Set..." -ForegroundColor Yellow
    try {
        $duplicated = Invoke-RestMethod -Uri "$baseUrl/admin/exam-sets/$examSetId/duplicate" -Method POST -Headers $headers
        Write-Host "OK Exam set duplicated!" -ForegroundColor Green
        Write-Host "  New ID: $($duplicated._id)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Duplicate exam set failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 12. Test Create Book
Write-Host "12. Testing Create Book..." -ForegroundColor Yellow
$bookBody = @{
    title = "Test Book"
    subtitle = "A Test Book Subtitle"
    description = "This is a test book description"
    author = "Test Author"
    publishedAt = "2024-01-01T00:00:00.000Z"
    isPublic = $true
} | ConvertTo-Json

try {
    $book = Invoke-RestMethod -Uri "$baseUrl/admin/books" -Method POST -Body $bookBody -ContentType "application/json" -Headers $headers
    $bookId = $book._id
    Write-Host "OK Book created!" -ForegroundColor Green
    Write-Host "  ID: $bookId" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Create book failed: $($_.Exception.Message)" -ForegroundColor Red
    $bookId = $null
}
Write-Host ""

# 13. Test Get Books (Public)
Write-Host "13. Testing Get Public Books..." -ForegroundColor Yellow
try {
    $books = Invoke-RestMethod -Uri "$baseUrl/books" -Method GET
    Write-Host "OK Retrieved public books!" -ForegroundColor Green
    Write-Host "  Total: $($books.total)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Get public books failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 14. Test Get Admin Books
Write-Host "14. Testing Get Admin Books..." -ForegroundColor Yellow
try {
    $adminBooks = Invoke-RestMethod -Uri "$baseUrl/admin/books" -Method GET -Headers $headers
    Write-Host "OK Retrieved admin books!" -ForegroundColor Green
    Write-Host "  Total: $($adminBooks.total)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Get admin books failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 15. Test Get Results (should be empty)
Write-Host "15. Testing Get Results..." -ForegroundColor Yellow
try {
    $results = Invoke-RestMethod -Uri "$baseUrl/admin/results" -Method GET -Headers $headers
    Write-Host "OK Retrieved results!" -ForegroundColor Green
    Write-Host "  Total: $($results.total)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Get results failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 16. Test Get Book by ID
if ($bookId) {
    Write-Host "16. Testing Get Book by ID..." -ForegroundColor Yellow
    try {
        $bookDetail = Invoke-RestMethod -Uri "$baseUrl/books/$bookId" -Method GET
        Write-Host "OK Book detail retrieved!" -ForegroundColor Green
        Write-Host "  Title: $($bookDetail.title)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Get book detail failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 17. Test Update Book
if ($bookId) {
    Write-Host "17. Testing Update Book..." -ForegroundColor Yellow
    $updateBookBody = @{
        title = "Updated Test Book"
        description = "Updated description"
    } | ConvertTo-Json

    try {
        $updatedBook = Invoke-RestMethod -Uri "$baseUrl/admin/books/$bookId" -Method PATCH -Body $updateBookBody -ContentType "application/json" -Headers $headers
        Write-Host "OK Book updated!" -ForegroundColor Green
        Write-Host "  New title: $($updatedBook.title)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Update book failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 18. Test Export Results JSON
Write-Host "18. Testing Export Results JSON..." -ForegroundColor Yellow
try {
    $exportJson = Invoke-RestMethod -Uri "$baseUrl/admin/results/export/json" -Method GET -Headers $headers
    Write-Host "OK Results exported as JSON!" -ForegroundColor Green
    Write-Host "  Count: $($exportJson.Count)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Export JSON failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 19. Test Export Results CSV
Write-Host "19. Testing Export Results CSV..." -ForegroundColor Yellow
try {
    $exportCsv = Invoke-WebRequest -Uri "$baseUrl/admin/results/export/csv" -Method GET -Headers $headers
    Write-Host "OK Results exported as CSV!" -ForegroundColor Green
    Write-Host "  Content length: $($exportCsv.Content.Length) bytes" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Export CSV failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 20. Test Update Exam Set
if ($examSetId) {
    Write-Host "20. Testing Update Exam Set..." -ForegroundColor Yellow
    $updateBody = @{
        name = "Updated Test Exam Set"
        description = "Updated description"
    } | ConvertTo-Json

    try {
        $updated = Invoke-RestMethod -Uri "$baseUrl/admin/exam-sets/$examSetId" -Method PATCH -Body $updateBody -ContentType "application/json" -Headers $headers
        Write-Host "OK Exam set updated!" -ForegroundColor Green
        Write-Host "  New name: $($updated.name)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Update exam set failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 21. Test Deactivate Exam
Write-Host "21. Testing Deactivate Exam..." -ForegroundColor Yellow
try {
    $deactivated = Invoke-RestMethod -Uri "$baseUrl/admin/exam/deactivate" -Method POST -Headers $headers
    Write-Host "OK Exam deactivated!" -ForegroundColor Green
} catch {
    Write-Host "FAIL Deactivate exam failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== All Tests Completed ===" -ForegroundColor Cyan

