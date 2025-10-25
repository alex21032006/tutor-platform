import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from config import BOT_TOKEN, WEBAPP_URL, PREDEFINED_USERS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TutorBot:
    def __init__(self):
        self.application = Application.builder().token(BOT_TOKEN).build()
        self.setup_handlers()

    def setup_handlers(self):
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id

        keyboard = [[InlineKeyboardButton(
            "🎓 Открыть личный кабинет",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]]

        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            "Добро пожаловать в образовательную платформу! 🎯\n\n"
            "Нажмите кнопку ниже чтобы открыть личный кабинет:",
            reply_markup=reply_markup
        )

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("Используйте кнопку 'Открыть личный кабинет' для доступа ко всем функциям!")

    def run(self):
        logger.info("Бот запущен...")
        self.application.run_polling()


if __name__ == "__main__":
    bot = TutorBot()
    bot.run()