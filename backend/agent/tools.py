def create_workout_plan(goal: str, experience: str = "beginner") -> str:
    goal_key = goal.lower()
    if "lose" in goal_key or "fat" in goal_key:
        return (
            "Workout plan for fat loss:\n"
            "Day 1: Full-body strength, 45 min, moderate load.\n"
            "Day 2: 30 min brisk walk or cycling.\n"
            "Day 3: Upper body push-pull, 3 sets each.\n"
            "Day 4: Mobility and core, 20 min.\n"
            "Day 5: Lower body strength plus 10 min intervals.\n"
            "Day 6: Long easy cardio session.\n"
            "Day 7: Rest."
        )
    if "muscle" in goal_key or "bulk" in goal_key or "gain" in goal_key:
        return (
            "Workout plan for muscle gain:\n"
            "Day 1: Push workout, 4 exercises, 3-4 sets.\n"
            "Day 2: Pull workout, 4 exercises, 3-4 sets.\n"
            "Day 3: Legs, 5 exercises, controlled tempo.\n"
            "Day 4: Rest or light mobility.\n"
            "Day 5: Upper body hypertrophy.\n"
            "Day 6: Lower body plus core.\n"
            "Day 7: Rest."
        )
    return (
        f"Workout plan for a {experience} trainee:\n"
        "Day 1: Full-body strength.\n"
        "Day 2: Light cardio and mobility.\n"
        "Day 3: Upper body.\n"
        "Day 4: Rest.\n"
        "Day 5: Lower body and core.\n"
        "Day 6: Conditioning.\n"
        "Day 7: Rest."
    )


def nutrition_advice(topic: str = "") -> str:
    topic_key = topic.lower()
    if "protein" in topic_key:
        return "Aim for 1.6 to 2.2 g of protein per kg of bodyweight spread across 3 to 5 meals."
    if "fat loss" in topic_key or "lose" in topic_key:
        return "Keep a small calorie deficit, prioritize protein and fiber, and build meals around whole foods."
    if "muscle" in topic_key or "gain" in topic_key:
        return "Use a small calorie surplus, keep protein high, and center meals around carbs before and after training."
    return (
        "Nutrition baseline: keep protein high, include fruits and vegetables daily, "
        "drink enough water, and limit heavily processed snacks."
    )
