import re
from typing import Optional

from .tools import create_workout_plan, nutrition_advice
try:
    from backend.openclaw_client import openclaw_client
except ImportError:
    from openclaw_client import openclaw_client

try:
    from backend.db import get_progress_summary, get_recent_weights, log_weight
except ImportError:
    from db import get_progress_summary, get_recent_weights, log_weight


GOAL_KEYWORDS = {
    "fat loss": ("lose weight", "fat loss", "cut", "lean", "slim"),
    "muscle gain": ("gain muscle", "build muscle", "bulk", "hypertrophy"),
    "general fitness": ("fit", "healthy", "general fitness", "active"),
    "strength": ("strength", "stronger", "power"),
}


def _detect_goal(message: str) -> Optional[str]:
    lowered = message.lower()
    for goal, phrases in GOAL_KEYWORDS.items():
        if any(phrase in lowered for phrase in phrases):
            return goal
    return None


def _build_progress_reply(user_id: str) -> str:
    summary = get_progress_summary(user_id)
    history = get_recent_weights(user_id, limit=5)
    if not summary:
        return "No progress logged yet. Send something like 'log weight 72.4' to start tracking."

    lines = [
        f"Latest logged weight: {summary['latest_weight']} kg on {summary['latest_logged_at']}.",
    ]
    if summary["change_from_previous"] is not None:
        direction = "down" if summary["change_from_previous"] < 0 else "up"
        lines.append(
            f"Change from previous entry: {abs(summary['change_from_previous'])} kg {direction}."
        )
    if len(history) > 1:
        recent_weights = ", ".join(f"{entry['weight']} kg" for entry in history)
        lines.append(f"Recent history: {recent_weights}.")
    lines.append("Reply with your current goal if you want an updated plan.")
    return "\n".join(lines)


def _build_openclaw_context(user_id: str) -> str:
    progress_summary = get_progress_summary(user_id)
    history = get_recent_weights(user_id, limit=5)
    lines = [
        "You are a fitness coach AI.",
        "You help with fitness goals, personalized workouts, nutrition guidance, and progress tracking.",
        "Keep answers practical, specific, and concise.",
        "Do not claim medical certainty. Recommend professional help for injury, eating disorder, or severe symptoms.",
    ]
    if progress_summary:
        lines.append(
            f"Latest logged weight: {progress_summary['latest_weight']} kg at {progress_summary['latest_logged_at']}."
        )
        if progress_summary["change_from_previous"] is not None:
            lines.append(
                f"Weight change from previous log: {progress_summary['change_from_previous']} kg."
            )
    if history:
        history_text = ", ".join(f"{entry['weight']} kg on {entry['created_at']}" for entry in history)
        lines.append(f"Recent weight history: {history_text}.")
    return "\n".join(lines)


def run_agent(message: str, user_id: str) -> str:
    normalized_message = message.strip()
    lowered_message = normalized_message.lower()

    weight_match = re.search(
        r"(?:log|track|update)\s+weight\s+(\d+(?:\.\d+)?)",
        lowered_message,
    )
    if weight_match:
        weight = float(weight_match.group(1))
        log_weight(user_id, weight)
        return (
            f"Weight logged: {weight} kg.\n"
            "Ask for progress anytime to see your recent trend."
        )

    if "progress" in lowered_message or "history" in lowered_message:
        return _build_progress_reply(user_id)

    if openclaw_client.is_configured():
        try:
            return openclaw_client.generate_reply(
                user_id=user_id,
                message=normalized_message,
                context=_build_openclaw_context(user_id),
            )
        except Exception:
            # Fallback keeps the app usable if the gateway is down or misconfigured.
            pass

    goal = _detect_goal(lowered_message)
    if "workout" in lowered_message or "plan" in lowered_message or goal:
        resolved_goal = goal or "general fitness"
        workout_plan = create_workout_plan(resolved_goal)
        return (
            f"Goal detected: {resolved_goal}.\n"
            f"{workout_plan}\n"
            "Track your weight 1 to 3 times per week and ask for progress to adjust."
        )

    if any(
        keyword in lowered_message
        for keyword in ("diet", "nutrition", "calories", "protein", "meal")
    ):
        goal_hint = goal or lowered_message
        return nutrition_advice(goal_hint)

    return (
        "Tell me your goal, ask for a workout plan, ask a nutrition question, "
        "or log progress with 'log weight 72.4'."
    )
