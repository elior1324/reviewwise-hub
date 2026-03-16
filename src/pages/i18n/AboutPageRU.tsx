/**
 * AboutPageRU.tsx — Russian version of the About page
 * Rendered by AboutPage.tsx when language === "ru".
 * Hebrew is the legally binding version.
 */

import { ShieldCheck, BarChart2, AlertTriangle, Clock, CheckCircle, XCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { computeVerifiedPricing, formatPrice, LEARNER_DISCOUNT_RATE, PLATFORM_FEE_RATE, TOTAL_TRUST_CHARGE } from "@/lib/affiliate";
import LegalTranslationNotice from "@/components/LegalTranslationNotice";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const AboutPageRU = () => {
  const ex = computeVerifiedPricing(1000);

  return (
    <div dir="ltr" className="text-left">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <ShieldCheck size={16} /> Независимая система верификации
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Инфраструктура доверия —{" "}
              <span className="gradient-text glow-text">не маркетинговая платформа</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ReviewHub — это независимая система верификации. Мы подключаемся к платёжным системам
              и производим данные доверия на основе реальных коммерческих записей, а не слов автора
              курса о себе.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Legal notice */}
      <div className="container pt-8 max-w-4xl">
        <LegalTranslationNotice />
      </div>

      {/* Что мы делаем */}
      <section className="container py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
            Что мы делаем
          </motion.h2>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              ReviewHub — это инфраструктура доверия для цифрового образования. Платформа
              ранжирует онлайн-курсы по верифицированным отзывам покупателей и формирует
              независимую оценку доверия для каждого курса и автора. ReviewHub не является
              маркетинговой платформой и не выступает коммерческим партнёром авторов курсов.
            </p>
            <p>
              Оценки доверия, которые мы формируем, состоят из трёх измеримых показателей:
              объём отзывов, доля возвратов и жалоб, а также подтверждённый период активности.
              Наша полная методология находится в открытом доступе — вы можете проверить, как
              именно рассчитывается каждое число.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Модель 5/5 */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <Tag size={24} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                Модель 5/5 — полная операционная прозрачность
              </h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="space-y-5">
              <p className="text-foreground/80 leading-relaxed">
                ReviewHub работает по модели <strong className="text-foreground">5/5 Verified Deal</strong> —
                коммерческой инфраструктуре, построенной на принципе Win-Win-Win: ученик
                экономит, автор наращивает доверие, платформа зарабатывает на операциях.
              </p>

              {/* Таблица экономики */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
                <div className="bg-primary/10 px-5 py-3">
                  <p className="text-sm font-bold text-foreground">
                    Пример: курс стоимостью {formatPrice(ex.listPrice)}
                  </p>
                </div>
                <div className="divide-y divide-border/40 text-sm">
                  {[
                    { label: "Заявленная цена",           value: formatPrice(ex.listPrice),         note: "" },
                    { label: `Комиссия платформы (${(TOTAL_TRUST_CHARGE * 100).toFixed(0)}%)`, value: `−${formatPrice(ex.platformFee)}`, note: "инфраструктура доверия" },
                    { label: `Скидка ученику (${(LEARNER_DISCOUNT_RATE * 100).toFixed(0)}%)`, value: `−${formatPrice(ex.learnerDiscount)}`, note: "применяется автоматически" },
                    { label: "Автор получает",             value: formatPrice(ex.creatorReceives),   note: "чистая выплата" },
                    { label: "Ученик платит",              value: formatPrice(ex.learnerPays),       note: "цена со скидкой" },
                  ].map(({ label, value, note }) => (
                    <div key={label} className="px-5 py-2.5 flex items-center justify-between">
                      <span className="text-foreground/70">{label}</span>
                      <span className="font-semibold text-foreground">
                        {value}
                        {note && <span className="ml-2 text-[11px] text-muted-foreground font-normal">({note})</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Три кита доверия */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
            Три основы доверия
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-10 max-w-2xl">
            Формула оценки доверия строится на трёх независимо измеримых показателях.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart2,
                title: "Объём отзывов",
                description: "Количество верифицированных отзывов покупателей. Для получения оценки доверия требуется минимальный порог — это предотвращает накрутку небольшим числом поддельных отзывов.",
              },
              {
                icon: AlertTriangle,
                title: "Доля возвратов и жалоб",
                description: "Данные о возвратах и спорах поступают напрямую из платёжных систем, а не сообщаются автором. Высокий процент напрямую снижает оценку доверия.",
              },
              {
                icon: Clock,
                title: "Подтверждённый период активности",
                description: "Длительность верифицированного коммерческого присутствия автора. Долгосрочная деятельность — сигнал стабильности.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                custom={2}
                className="rounded-xl border border-border/50 p-6 bg-card"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Что такое ReviewHub */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-8">
              Что такое ReviewHub — и чем он не является
            </motion.h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { is: true,  text: "Независимая система верификации"           },
                { is: true,  text: "Подключается к реальным платёжным записям" },
                { is: true,  text: "Открытая методология"                      },
                { is: true,  text: "Независим от маркетинга авторов"           },
                { is: false, text: "Не является маркетинговым партнёром авторов" },
                { is: false, text: "Не принимает платные отзывы"               },
                { is: false, text: "Не гарантирует качество курса"             },
                { is: false, text: "Не несёт ответственности за контент автора" },
              ].map(({ is, text }) => (
                <div key={text} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/40">
                  {is
                    ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    : <XCircle    size={16} className="text-rose-500 shrink-0" />
                  }
                  <span className="text-sm text-foreground/80">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Контакты */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
            Свяжитесь с нами
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
            Вопросы о методологии, оспаривание оценки или деловое сотрудничество — пишите нам:
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <a
              href="mailto:support@reviewshub.info"
              className="text-primary font-medium hover:underline text-lg"
            >
              support@reviewshub.info
            </a>
          </motion.div>
          <motion.div variants={fadeUp} custom={3} className="mt-8">
            <Link to="/search">
              <Button size="lg" className="font-semibold">
                Перейти в библиотеку доверия
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPageRU;
