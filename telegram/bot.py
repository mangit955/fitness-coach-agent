import os

import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, filters


API_URL = os.getenv("FITNESS_API_URL",)
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    await update.message.reply_text(
        "Send your goal, ask for a workout or nutrition tip, or log progress with 'log weight 72.4'."
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None or update.message.text is None:
        return

    user_text = update.message.text
    try:
        response = requests.post(
            API_URL,
            json={
                "message": user_text,
                "user_id": str(update.message.from_user.id),
            },
            timeout=20,
        )
        response.raise_for_status()
        reply = response.json().get("response", "The coach did not return a response.")
    except requests.RequestException as exc:
        reply = f"Backend request failed: {exc}"

    await update.message.reply_text(reply)


def main() -> None:
    if not TOKEN:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN before starting the Telegram bot.")

    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    print("Bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
