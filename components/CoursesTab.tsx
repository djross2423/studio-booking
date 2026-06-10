"use client";

import type { Course } from "@/lib/types";
import { S } from "@/lib/styles";
import { useApp } from "@/lib/app-context";

export function CoursesTab({
  courses,
  setShowCourseModal,
  setEditingCourseId,
  setCourseName,
  setCourseDescription,
  setCourseFee,
  setCourseSessions,
  setCourseDuration,
}: {
  courses: Course[];
  setShowCourseModal: (b: boolean) => void;
  setEditingCourseId: (id: number | null) => void;
  setCourseName: (s: string) => void;
  setCourseDescription: (s: string) => void;
  setCourseFee: (s: string) => void;
  setCourseSessions: (s: string) => void;
  setCourseDuration: (s: string) => void;
}) {
  const { archiveCourse, showToast } = useApp();
  return (
        <div style={S.page}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              Courses
            </h2>

            <button
              onClick={() => setShowCourseModal(true)}
              style={{
                background: "linear-gradient(135deg,#6C3CE1,#8B5CF6)",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add Course
            </button>
          </div>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                background: "#1A1A24",
                border: "1px solid #2A2A3D",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {course.name}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "#9CA3AF",
                  lineHeight: 1.8,
                }}
              >
                📚 {course.totalSessions} Sessions
                <br />⏱ {course.sessionDuration} Hours
                <br />
                💰 ₹{course.fee.toLocaleString()}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <button
                  onClick={() => {
                    setEditingCourseId(course.id);

                    setCourseName(course.name);
                    setCourseDescription(course.description || "");
                    setCourseFee(String(course.fee));
                    setCourseSessions(String(course.totalSessions));
                    setCourseDuration(String(course.sessionDuration));

                    setShowCourseModal(true);
                  }}
                  style={{
                    flex: 1,
                    background: "rgba(108,60,225,0.15)",
                    border: "1px solid rgba(108,60,225,0.3)",
                    color: "#8B5CF6",
                    borderRadius: 10,
                    padding: "10px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    if (!confirm(`Archive "${course.name}"?`)) return;
                    archiveCourse.mutate(course.id, {
                      onSuccess: () => showToast("Course archived"),
                    });
                  }}
                  style={{
                    flex: 1,
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#EF4444",
                    borderRadius: 10,
                    padding: "10px",
                    cursor: "pointer",
                  }}
                >
                  Archive
                </button>
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#6B7280",
              }}
            >
              No courses yet
            </div>
          )}
        </div>
  );
}
