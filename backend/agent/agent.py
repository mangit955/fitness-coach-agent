from .tools import create_workout_plan, nutrition_advice

def run_agent(message, user_id):

    message = message.lower()

    if "workout" in message or "plan" in message:
        return create_workout_plan()

    if "diet" in message or "nutrition" in message:
        return nutrition_advice()

    return "Tell me your fitness goal and I will help create a plan."