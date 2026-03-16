/**
 * PrivacyPolicyRU.tsx — Russian version of the Privacy Policy
 * Hebrew is the legally binding version.
 */

import { Shield, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import LegalTranslationNotice from "@/components/LegalTranslationNotice";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={fadeUp}
    className="space-y-3"
  >
    <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
      <ChevronRight size={18} className="text-primary shrink-0" />
      {title}
    </h2>
    <div className="pl-6 text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </motion.section>
);

const PrivacyPolicyRU = () => (
  <div dir="ltr" className="text-left">
    {/* Hero */}
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
      <div className="container py-16 md:py-24 relative">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
            <Shield size={16} /> Политика конфиденциальности
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Политика конфиденциальности
          </h1>
          <p className="text-muted-foreground text-lg">Обновлено: 10 марта 2026 г. · ReviewHub</p>
          <p className="text-muted-foreground mt-2">
            Мы обязуемся защищать вашу конфиденциальность. Данная политика объясняет, какие данные
            мы собираем, для чего и как вы можете реализовать свои права.
          </p>
        </motion.div>
      </div>
    </section>

    <div className="container py-12 max-w-4xl">
      <LegalTranslationNotice />

      <div className="space-y-10">
        <Section title="1. Введение и область применения">
          <p>
            ReviewHub («мы», «наш», «платформа») обязуется защищать вашу конфиденциальность. Эта
            политика применяется ко всем пользователям сайта reviewhub.co.il.
          </p>
        </Section>

        <Section title="2. Данные, которые мы собираем">
          <p className="font-medium text-foreground">Данные, которые вы предоставляете напрямую:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Полное имя и адрес электронной почты (при регистрации)</li>
            <li>Пароль — хранится только в виде одностороннего хеша bcrypt</li>
            <li>Отзывы, которые вы пишете: текст, рейтинг, отображаемое имя (или «Анонимно»)</li>
            <li>Деловая информация (для владельцев бизнеса): имя, сайт, телефон, категория</li>
            <li>Доказательство покупки для верификации отзывов (не хранится; сохраняется только булевый результат)</li>
          </ul>
          <p className="font-medium text-foreground mt-3">Автоматически собираемые данные:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>IP-адрес — для безопасности и предотвращения мошенничества (удаляется через 90 дней)</li>
            <li>User-Agent и Referrer — для технической аналитики (только партнёрские ссылки)</li>
            <li>Сессионные файлы cookie — для аутентификации (истекают при выходе или через 30 дней)</li>
          </ul>
          <p className="font-medium text-foreground mt-3">Данные, которые мы НЕ собираем:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Данные банковских карт или платёжные реквизиты</li>
            <li>Биометрические данные</li>
            <li>Местоположение точнее уровня страны</li>
          </ul>
        </Section>

        <Section title="3. Как мы используем ваши данные">
          <ul className="list-disc pl-5 space-y-1">
            <li>Предоставление и улучшение услуг платформы</li>
            <li>Верификация отзывов и оценок доверия</li>
            <li>Безопасность и предотвращение мошенничества</li>
            <li>Отправка транзакционных уведомлений об услугах</li>
            <li>Соблюдение правовых обязательств</li>
          </ul>
          <p>
            Мы <strong>не</strong> продаём, не сдаём в аренду и не передаём ваши персональные
            данные третьим лицам. Мы не используем ваши данные для поведенческой рекламы.
          </p>
        </Section>

        <Section title="4. Сторонние сервисы">
          <p>Мы используем следующих процессоров данных (соглашения об обработке данных заключены):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — база данных и аутентификация (регион ЕС)</li>
            <li><strong>Cloudflare</strong> — CDN, защита от ботов (CAPTCHA)</li>
            <li>Платёжные системы — для проверки покупок (мы получаем только булевый результат верификации)</li>
          </ul>
        </Section>

        <Section title="5. Сроки хранения данных">
          <ul className="list-disc pl-5 space-y-1">
            <li>Данные аккаунта: хранятся, пока аккаунт активен + 3 года после удаления</li>
            <li>Отзывы: хранятся бессрочно (публичные данные платформы)</li>
            <li>Журналы IP: удаляются через 90 дней</li>
            <li>Cookie: сессионные истекают при выходе; постоянные — через 30 дней</li>
          </ul>
        </Section>

        <Section title="6. Ваши права">
          <p>Вы имеете право на:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Доступ</strong> — запросить копию ваших персональных данных</li>
            <li><strong>Исправление</strong> — скорректировать неточные данные</li>
            <li><strong>Удаление</strong> — запросить удаление ваших данных</li>
            <li><strong>Переносимость</strong> — получить ваши данные в машиночитаемом формате</li>
            <li><strong>Возражение</strong> — возразить против обработки данных</li>
          </ul>
          <p>
            Для реализации любого права обратитесь на{" "}
            <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
              support@reviewshub.info
            </a>. Мы отвечаем в течение 30 дней.
          </p>
        </Section>

        <Section title="7. Файлы cookie">
          <p>
            Мы используем строго необходимые файлы cookie для аутентификации и безопасности, а
            также аналитические cookie для отслеживания партнёрских ссылок. Рекламные cookie не
            используются.
          </p>
        </Section>

        <Section title="8. Безопасность">
          <p>
            Мы применяем стандартные меры безопасности: шифрование данных при хранении и передаче
            (TLS 1.2+), хеширование паролей bcrypt, регулярные аудиты безопасности.
          </p>
        </Section>

        <Section title="9. Несовершеннолетние">
          <p>
            Платформа не предназначена для лиц младше 18 лет. Мы не собираем данные
            несовершеннолетних намеренно.
          </p>
        </Section>

        <Section title="10. Контакты">
          <p>
            Вопросы о конфиденциальности:{" "}
            <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
              support@reviewshub.info
            </a>
          </p>
        </Section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicyRU;
