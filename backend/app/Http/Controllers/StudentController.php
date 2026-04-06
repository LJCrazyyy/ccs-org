<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;

class StudentController extends Controller
{
    private function normalizeYearLevel($value): int
    {
        if (is_numeric($value)) {
            $num = (int) $value;
            return max(1, min(4, $num));
        }

        if (is_string($value) && preg_match('/^\d+/', $value, $matches)) {
            $num = (int) $matches[0];
            return max(1, min(4, $num));
        }

        return 1;
    }

    private function normalizeStatus(?string $value): string
    {
        $status = strtolower((string) $value);

        return match ($status) {
            'regular', 'active' => 'active',
            'irregular', 'inactive' => 'inactive',
            'graduated' => 'graduated',
            default => 'active',
        };
    }

    private function normalizeDelimitedValue(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map('trim', $value)));
        }

        if (is_string($value)) {
            return array_values(array_filter(array_map('trim', preg_split('/[,;]+/', $value))));
        }

        return [];
    }

    private function formatDelimitedValue(mixed $value): string
    {
        $values = $this->normalizeDelimitedValue($value);
        return implode(', ', $values);
    }

    private function mapStudentForFrontend(Student $student): array
    {
        $profile = is_array($student->profile)
            ? $student->profile
            : (json_decode($student->profile ?? '', true) ?: []);
        $skills = $this->normalizeDelimitedValue($profile['skills'] ?? []);
        $organizations = $this->normalizeDelimitedValue($profile['organizations'] ?? []);
        $activities = $this->normalizeDelimitedValue($profile['activities'] ?? []);

        $yearSuffix = match ((int) $student->year_level) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th',
        };

        return [
            'id' => (string) $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'idNumber' => $profile['idNumber'] ?? '',
            'program' => $student->department,
            'year' => $student->year_level . $yearSuffix,
            'status' => $student->status === 'inactive' ? 'Irregular' : 'Regular',
            'phone' => $profile['phone'] ?? '',
            'address' => $profile['address'] ?? '',
            'dateOfBirth' => $profile['dateOfBirth'] ?? '',
            'skills' => implode(', ', $skills),
            'skillsArray' => $skills,
            'organizations' => implode(', ', $organizations),
            'organizationsArray' => $organizations,
            'activities' => implode(', ', $activities),
            'activitiesArray' => $activities,
            'academicHistory' => $profile['academic_history'] ?? [],
            'created_at' => $student->created_at,
            'updated_at' => $student->updated_at,
        ];
    }

    // API CRUD methods
    public function index(Request $request)
    {
        $query = Student::query();

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('skill')) {
            $skill = trim($request->skill);
            $escaped = str_replace('"', '\\"', $skill);
            $query->where(function ($subQuery) use ($skill, $escaped) {
                $subQuery->where('profile', 'like', '%"' . $escaped . '"%')
                    ->orWhere('profile', 'like', '%' . $skill . '%');
            });
        }

        if ($request->filled('organization')) {
            $organization = trim($request->organization);
            $escaped = str_replace('"', '\\"', $organization);
            $query->where(function ($subQuery) use ($organization, $escaped) {
                $subQuery->where('profile', 'like', '%"' . $escaped . '"%')
                    ->orWhere('profile', 'like', '%' . $organization . '%');
            });
        }

        if ($request->filled('activity')) {
            $activity = trim($request->activity);
            $escaped = str_replace('"', '\\"', $activity);
            $query->where(function ($subQuery) use ($activity, $escaped) {
                $subQuery->where('profile', 'like', '%"' . $escaped . '"%')
                    ->orWhere('profile', 'like', '%' . $activity . '%');
            });
        }

        $students = $query->get()->map(function (Student $student) {
            return $this->mapStudentForFrontend($student);
        });

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'department' => 'nullable|string|max:255',
            'program' => 'nullable|string|max:255',
            'year_level' => 'nullable',
            'year' => 'nullable',
            'status' => 'nullable|string',
            'idNumber' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'dateOfBirth' => 'nullable|string|max:255',
            'skills' => 'nullable',
            'organizations' => 'nullable',
            'activities' => 'nullable',
            'academicHistory' => 'nullable',
        ]);

        $student = Student::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'department' => $validated['department'] ?? $validated['program'] ?? 'BSCS',
            'year_level' => $this->normalizeYearLevel($validated['year_level'] ?? $validated['year'] ?? 1),
            'status' => $this->normalizeStatus($validated['status'] ?? 'active'),
            'profile' => [
                'idNumber' => $validated['idNumber'] ?? '',
                'phone' => $validated['phone'] ?? '',
                'address' => $validated['address'] ?? '',
                'dateOfBirth' => $validated['dateOfBirth'] ?? '',
                'skills' => $this->normalizeDelimitedValue($validated['skills'] ?? []),
                'organizations' => $this->normalizeDelimitedValue($validated['organizations'] ?? []),
                'activities' => $this->normalizeDelimitedValue($validated['activities'] ?? []),
                'academic_history' => $validated['academicHistory'] ?? [],
            ],
        ]);

        return response()->json($this->mapStudentForFrontend($student), 201);
    }

    public function show($id)
    {
        $student = Student::findOrFail($id);
        return response()->json($this->mapStudentForFrontend($student));
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email',
            'department' => 'sometimes|string|max:255',
            'program' => 'sometimes|string|max:255',
            'year_level' => 'sometimes',
            'year' => 'sometimes',
            'status' => 'sometimes|string',
            'idNumber' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:255',
            'address' => 'sometimes|nullable|string|max:255',
            'dateOfBirth' => 'sometimes|nullable|string|max:255',
            'skills' => 'sometimes|nullable',
            'organizations' => 'sometimes|nullable',
            'activities' => 'sometimes|nullable',
            'academicHistory' => 'sometimes|nullable',
        ]);

        $student = Student::findOrFail($id);
        $payload = [];

        if (array_key_exists('name', $validated)) {
            $payload['name'] = $validated['name'];
        }
        if (array_key_exists('email', $validated)) {
            $payload['email'] = $validated['email'];
        }
        if (array_key_exists('department', $validated) || array_key_exists('program', $validated)) {
            $payload['department'] = $validated['department'] ?? $validated['program'];
        }
        if (array_key_exists('year_level', $validated) || array_key_exists('year', $validated)) {
            $payload['year_level'] = $this->normalizeYearLevel($validated['year_level'] ?? $validated['year']);
        }
        if (array_key_exists('status', $validated)) {
            $payload['status'] = $this->normalizeStatus($validated['status']);
        }

        $profile = is_array($student->profile)
            ? $student->profile
            : (json_decode($student->profile ?? '', true) ?: []);
        foreach (['idNumber', 'phone', 'address', 'dateOfBirth'] as $field) {
            if (array_key_exists($field, $validated)) {
                $profile[$field] = $validated[$field] ?? '';
            }
        }

        if (array_key_exists('skills', $validated)) {
            $profile['skills'] = $this->normalizeDelimitedValue($validated['skills'] ?? []);
        }
        if (array_key_exists('organizations', $validated)) {
            $profile['organizations'] = $this->normalizeDelimitedValue($validated['organizations'] ?? []);
        }
        if (array_key_exists('activities', $validated)) {
            $profile['activities'] = $this->normalizeDelimitedValue($validated['activities'] ?? []);
        }
        if (array_key_exists('academicHistory', $validated)) {
            $profile['academic_history'] = $validated['academicHistory'] ?? [];
        }

        $payload['profile'] = $profile;

        $student->update($payload);

        return response()->json($this->mapStudentForFrontend($student->fresh()));
    }

    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json(['message' => 'Student deleted successfully']);
    }

    // 4. Email/message student (stub)
    public function messageStudent(Request $request, $id)
    {
        // Implement email/message logic here
        return response()->json(['message' => 'Message sent (stub)']);
    }
}
