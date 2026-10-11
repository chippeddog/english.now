import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	BookOpen,
	CheckCircle2,
	Clock,
	Mic,
	PenTool,
	Play,
	Sparkles,
	Star,
	Target,
	Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	CATEGORY_INFO,
	type Course,
	type Lesson,
	PRESET_COURSES,
	SKILL_INFO,
} from "@/lib/courses-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/courses/$courseId")({
	component: CourseDetailPage,
});

function CourseDetailPage() {
	const { courseId } = Route.useParams();
	const navigate = useNavigate();

	const [course, setCourse] = useState<Course | undefined>(() =>
		PRESET_COURSES.find((c) => c.id === courseId),
	);

	const handleToggleLessonComplete = useCallback((lessonId: string) => {
		setCourse((prev) => {
			if (!prev) return prev;
			const updatedLessons = prev.lessons.map((lesson) =>
				lesson.id === lessonId
					? { ...lesson, completed: !lesson.completed }
					: lesson,
			);
			const completedCount = updatedLessons.filter((l) => l.completed).length;
			const progress = Math.round(
				(completedCount / updatedLessons.length) * 100,
			);
			return { ...prev, lessons: updatedLessons, progress };
		});
	}, []);

	const handleDelete = useCallback(() => {
		navigate({ to: "/courses" });
	}, [navigate]);

	if (!course) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center">
				<BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
				<h1 className="mb-2 font-semibold text-lg">Course not found</h1>
				<p className="mb-4 text-muted-foreground text-sm">
					The course you're looking for doesn't exist.
				</p>
				<Button asChild>
					<Link to="/courses">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Courses
					</Link>
				</Button>
			</div>
		);
	}

	const CategoryIcon = CATEGORY_INFO[course.category].icon;
	const completedLessons = course.lessons.filter((l) => l.completed).length;
	const completedMinutes = course.lessons
		.filter((l) => l.completed)
		.reduce((a, l) => a + l.duration, 0);

	const lessonTypeIcon: Record<Lesson["type"], typeof Play> = {
		video: Play,
		reading: BookOpen,
		exercise: PenTool,
		quiz: Target,
		speaking: Mic,
	};

	return (
		<div className="min-h-screen">
			<div className="mx-auto px-4 py-8 sm:px-6 lg:px-8 xl:max-w-4xl">
				<Button variant="ghost" asChild className="mb-6 gap-2">
					<Link to="/courses">
						<ArrowLeft className="h-4 w-4" />
						Back to Courses
					</Link>
				</Button>

				<div
					className={cn(
						"relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 md:p-8",
						course.color,
					)}
				>
					<div className="flex flex-col gap-6 md:flex-row md:items-start">
						<div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-background/80 text-5xl backdrop-blur md:h-28 md:w-28">
							{course.thumbnail}
						</div>
						<div className="flex-1 space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant={course.level}>{course.level}</Badge>
								<Badge
									variant="outline"
									className={CATEGORY_INFO[course.category].color}
								>
									<CategoryIcon className="mr-1 h-3 w-3" />
									{CATEGORY_INFO[course.category].label}
								</Badge>
								{course.isCustom && (
									<Badge variant="secondary">
										<Sparkles className="mr-1 h-3 w-3" />
										Custom
									</Badge>
								)}
							</div>
							<h1 className="font-bold font-lyon text-2xl leading-tight md:text-3xl">
								{course.title}
							</h1>
							<p className="text-muted-foreground">{course.description}</p>

							<div className="flex flex-wrap items-center gap-4 text-sm">
								<div className="flex items-center gap-1 text-amber-500">
									<Star className="h-4 w-4 fill-current" />
									<span className="font-semibold">{course.rating}</span>
								</div>
								<span className="text-muted-foreground">
									{course.enrolledStudents.toLocaleString()} learners
								</span>
								<span className="flex items-center gap-1 text-muted-foreground">
									<Clock className="h-4 w-4" />
									{Math.round(course.totalDuration / 60)}h{" "}
									{course.totalDuration % 60}m
								</span>
							</div>
						</div>
					</div>

					<div className="mt-6 space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium">Progress</span>
							<span className="text-muted-foreground">
								{completedLessons}/{course.lessons.length} lessons ·{" "}
								{Math.round(completedMinutes / 60)}h {completedMinutes % 60}m
								completed
							</span>
						</div>
						<Progress value={course.progress} className="h-2" />
					</div>
				</div>

				<div className="mt-8">
					<h2 className="mb-4 font-semibold text-lg">Skills You'll Learn</h2>
					<div className="flex flex-wrap gap-2">
						{course.skills.map((skill) => {
							const skillInfo = SKILL_INFO[skill];
							return (
								<div
									key={skill}
									className={cn(
										"flex items-center gap-1.5 rounded-lg border bg-muted/50 px-4 py-2",
										skillInfo.color,
									)}
								>
									<skillInfo.icon className="h-4 w-4" />
									<span className="font-medium">{skillInfo.label}</span>
								</div>
							);
						})}
					</div>
				</div>

				<div className="mt-8">
					<h2 className="mb-4 font-semibold text-lg">
						Lessons ({course.lessons.length})
					</h2>
					<div className="space-y-3">
						{course.lessons.map((lesson, index) => {
							const LessonIcon = lessonTypeIcon[lesson.type];
							return (
								<div
									key={lesson.id}
									className={cn(
										"flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50",
										lesson.completed &&
											"border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20",
									)}
								>
									<button
										type="button"
										onClick={() => handleToggleLessonComplete(lesson.id)}
										className={cn(
											"flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
											lesson.completed
												? "border-green-500 bg-green-500 text-white"
												: "border-muted-foreground/30 hover:border-primary",
										)}
									>
										{lesson.completed ? (
											<CheckCircle2 className="h-5 w-5" />
										) : (
											<span className="font-medium text-muted-foreground">
												{index + 1}
											</span>
										)}
									</button>
									<div className="min-w-0 flex-1">
										<p
											className={cn(
												"truncate font-medium",
												lesson.completed &&
													"text-green-700 dark:text-green-400",
											)}
										>
											{lesson.title}
										</p>
										<div className="flex items-center gap-2 text-muted-foreground text-sm">
											<LessonIcon className="h-3.5 w-3.5" />
											<span className="capitalize">{lesson.type}</span>
											<span>·</span>
											<Clock className="h-3.5 w-3.5" />
											<span>{lesson.duration} min</span>
										</div>
									</div>
									<Button
										size="sm"
										variant={lesson.completed ? "outline" : "default"}
									>
										{lesson.completed ? "Review" : "Start"}
									</Button>
								</div>
							);
						})}
					</div>
				</div>

				{course.isCustom && (
					<div className="mt-8 flex justify-end border-t pt-6">
						<Button
							variant="ghost"
							className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={handleDelete}
						>
							<Trash2 className="h-4 w-4" />
							Delete Course
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
