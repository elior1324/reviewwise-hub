/**
 * TermsRU.tsx — Russian version of the Terms of Service
 * Hebrew is the legally binding version.
 */

import { Scale, ChevronRight } from "lucide-react";
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

const TermsRU = () => (
  <div dir="ltr" className="text-left">
    {/* Hero */}
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
      <div className="container py-16 md:py-24 relative">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
            <Scale size={16} /> Условия использования
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Условия использования
          </h1>
          <p className="text-muted-foreground text-lg">Версия 1.0 — март 2026 г.</p>
          <p className="text-muted-foreground mt-2">
            Настоящие условия регулируют ваш доступ к платформе ReviewHub и использование её
            услуг. Пожалуйста, внимательно прочитайте их.
          </p>
        </motion.div>
      </div>
    </section>

    <div className="container py-12 max-w-4xl">
      <LegalTranslationNotice />

      <div className="space-y-10">
        <Section title="1. Введение">
          <p>
            ReviewHub является <strong>исключительно технологической платформой</strong>,
            выступающей посредником между владельцами бизнеса и потребителями. Платформа не
            является стороной каких-либо сделок, договорных или правовых отношений между
            владельцами бизнеса, потребителями и авторами отзывов.
          </p>
          <p>
            Используя платформу — бесплатно или на платной основе — вы принимаете настоящие
            условия. Доступ к платформе обусловлен вашим согласием с ними.
          </p>
        </Section>

        <Section title="2. Определения">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Платформа</strong> — сайт ReviewHub на reviewhub.co.il и все связанные сервисы</li>
            <li><strong>Пользователь</strong> — любое лицо, получающее доступ к платформе</li>
            <li><strong>Владелец бизнеса</strong> — пользователь, зарегистрировавший бизнес-профиль</li>
            <li><strong>Отзыв</strong> — любой текстовый или рейтинговый контент, опубликованный пользователем</li>
            <li><strong>Оценка доверия</strong> — алгоритмический балл, формируемый платформой на основе верифицированных данных</li>
          </ul>
        </Section>

        <Section title="3. Регистрация аккаунта">
          <p>
            Для доступа к ряду функций необходимо создать аккаунт. Вы несёте ответственность за
            сохранность учётных данных и за все действия, совершаемые в вашем аккаунте. Вы
            обязаны предоставлять достоверную информацию. Аккаунты не могут быть переданы
            третьим лицам.
          </p>
        </Section>

        <Section title="4. Отзывы и контент">
          <ul className="list-disc pl-5 space-y-1">
            <li>Отзывы должны основываться на реальном личном опыте</li>
            <li>Запрещается публиковать ложные, вводящие в заблуждение или фиктивные отзывы</li>
            <li>Отзывы не должны содержать оскорблений, клеветы или незаконных материалов</li>
            <li>Верифицированные отзывы покупателей требуют подтверждения покупки</li>
            <li>Платформа может удалять отзывы, нарушающие настоящие правила, без предупреждения</li>
          </ul>
          <p>
            Публикуя контент, вы предоставляете ReviewHub всемирную безвозмездную лицензию на
            его отображение, воспроизведение и распространение на платформе.
          </p>
        </Section>

        <Section title="5. Оценки доверия">
          <p>
            Оценки доверия формируются алгоритмически на основе верифицированных данных. Они
            отражают нашу независимую оценку и не являются гарантией качества, надёжности или
            пригодности услуг. Оценки могут меняться по мере поступления новых данных.
            ReviewHub не несёт ответственности за решения, принятые на основе оценок доверия.
          </p>
        </Section>

        <Section title="6. Запрещённые действия">
          <p>Запрещается:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Попытки манипулировать, покупать или стимулировать отзывы</li>
            <li>Систематически извлекать данные платформы без разрешения (парсинг)</li>
            <li>Обходить средства защиты или пытаться получить несанкционированный доступ</li>
            <li>Использовать платформу для спама</li>
            <li>Выдавать себя за другое лицо или организацию</li>
          </ul>
        </Section>

        <Section title="7. Цены и оплата">
          <p>
            Платные услуги тарифицируются согласно ценам, опубликованным на платформе на момент
            покупки. Цены могут изменяться с разумным уведомлением. Платформа работает по модели
            5/5 Verified Deal — полная механика ценообразования раскрыта на странице «О нас».
          </p>
        </Section>

        <Section title="8. Ограничения ответственности">
          <p>
            Платформа предоставляется «как есть». ReviewHub не даёт никаких гарантий в
            отношении точности, полноты или пригодности какого-либо контента. В максимально
            допустимой законом мере ответственность ReviewHub ограничена суммой, уплаченной вами
            за соответствующий сервис за три месяца, предшествующих претензии.
          </p>
        </Section>

        <Section title="9. Прекращение доступа">
          <p>
            Мы можем приостановить или удалить ваш аккаунт при нарушении настоящих условий. Вы
            можете удалить аккаунт в любое время. После прекращения доступа ваше право
            пользоваться платформой прекращается. Опубликованные вами отзывы могут оставаться на
            платформе.
          </p>
        </Section>

        <Section title="10. Применимое право">
          <p>
            Настоящие условия регулируются законодательством государства Израиль. Споры подлежат
            рассмотрению в исключительной юрисдикции компетентных судов Израиля.{" "}
            <strong>Версия настоящих условий на иврите является юридически обязывающей.</strong>
          </p>
        </Section>

        <Section title="11. Контакты">
          <p>
            Вопросы по условиям использования:{" "}
            <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
              support@reviewshub.info
            </a>
          </p>
        </Section>
      </div>
    </div>
  </div>
);

export default TermsRU;
