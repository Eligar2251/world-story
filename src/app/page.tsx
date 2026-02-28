import Link from 'next/link';
import { PenTool, Globe, BookOpen, ArrowRight } from 'lucide-react';
import Carousel from '@/components/ui/Carousel';
import ProjectCard from '@/components/cards/ProjectCard';
import {
  getPopularProjects,
  getNewProjects,
  getCompletedProjects,
} from '@/lib/api/projects';

const features = [
  {
    icon: BookOpen,
    title: 'Читайте истории',
    desc: 'Находите произведения, отслеживайте обновления, ведите личную библиотеку.',
  },
  {
    icon: PenTool,
    title: 'Пишите книги',
    desc: 'Профессиональная студия с редактором, структурой глав и статистикой.',
  },
  {
    icon: Globe,
    title: 'Стройте миры',
    desc: 'Персонажи, локации, фракции, таймлайн — всё в одной системе.',
  },
];

export const revalidate = 300;

export default async function HomePage() {
  const [popular, newest, completed] = await Promise.all([
    getPopularProjects(12),
    getNewProjects(12),
    getCompletedProjects(12),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Hero */}
      <section className="py-20 md:py-32 text-center max-w-3xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">
          Платформа для историй
        </p>
        <h1 className="text-4xl md:text-[3.5rem] font-bold text-ink leading-[1.1] tracking-tight mb-5">
          Создавайте миры.
          <br />
          Рассказывайте истории.
        </h1>
        <p className="text-base md:text-lg text-ink-secondary leading-relaxed mb-9 max-w-xl mx-auto">
          Место, где писатели строят глубокие миры, а читатели
          погружаются в них. Студия, читалка и ворлдбилдинг — всё в одном.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-all duration-150 active:scale-[0.98] shadow-sm hover:shadow"
          >
            Начать бесплатно
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 border border-line text-ink-secondary hover:text-ink hover:border-accent/30 hover:bg-surface-overlay px-6 py-3 rounded-lg font-medium transition-all duration-150"
          >
            Каталог
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="pb-16 grid md:grid-cols-3 gap-5">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="bg-surface-raised border border-line rounded-xl p-6 hover:shadow-soft hover:border-accent/15 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-accent" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                {f.desc}
              </p>
            </div>
          );
        })}
      </section>

      {/* Carousels */}
      <div className="space-y-12 pb-20">
        {popular.projects.length > 0 && (
          <Carousel title="Популярное" href="/catalog?sort=popular">
            {popular.projects.map((p) => (
              <div
                key={p.id}
                className="shrink-0 w-[155px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProjectCard project={p} size="sm" />
              </div>
            ))}
          </Carousel>
        )}

        {newest.projects.length > 0 && (
          <Carousel title="Новинки" href="/catalog?sort=new">
            {newest.projects.map((p) => (
              <div
                key={p.id}
                className="shrink-0 w-[155px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProjectCard project={p} size="sm" />
              </div>
            ))}
          </Carousel>
        )}

        {completed.projects.length > 0 && (
          <Carousel
            title="Завершённые"
            href="/catalog?sort=popular&status=completed"
          >
            {completed.projects.map((p) => (
              <div
                key={p.id}
                className="shrink-0 w-[155px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProjectCard project={p} size="sm" />
              </div>
            ))}
          </Carousel>
        )}
      </div>
    </div>
  );
}