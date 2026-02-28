import Link from 'next/link';
import { BookOpen, PenTool, Globe } from 'lucide-react';
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
    desc: 'Находите произведения, отслеживайте обновления, ведите библиотеку.',
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

export const revalidate = 300; // ISR: 5 минут

export default async function HomePage() {
  const [popular, newest, completed] = await Promise.all([
    getPopularProjects(12),
    getNewProjects(12),
    getCompletedProjects(12),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Hero */}
      <section className="py-16 md:py-28 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-ink mb-4 leading-tight">
          Создавайте миры.
          <br />
          <span className="text-accent">Рассказывайте истории.</span>
        </h1>
        <p className="text-lg text-ink-secondary max-w-2xl mx-auto mb-8">
          Платформа, где писатели строят глубокие миры, а читатели
          погружаются в них. Студия, читалка и ворлдбилдинг — в одном месте.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded font-medium transition-colors"
          >
            Начать бесплатно
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 border border-line text-ink-secondary hover:bg-surface-overlay px-6 py-3 rounded font-medium transition-colors"
          >
            Каталог
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="pb-12 grid md:grid-cols-3 gap-6">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="bg-surface-raised border border-line rounded-lg p-6 hover:shadow-soft transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-accent-soft flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">
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
      <div className="space-y-10 pb-16">
        {popular.projects.length > 0 && (
          <Carousel title="Популярное" href="/catalog?sort=popular">
            {popular.projects.map((p) => (
              <div key={p.id} className="shrink-0 w-[160px]" style={{ scrollSnapAlign: 'start' }}>
                <ProjectCard project={p} size="sm" />
              </div>
            ))}
          </Carousel>
        )}

        {newest.projects.length > 0 && (
          <Carousel title="Новинки" href="/catalog?sort=new">
            {newest.projects.map((p) => (
              <div key={p.id} className="shrink-0 w-[160px]" style={{ scrollSnapAlign: 'start' }}>
                <ProjectCard project={p} size="sm" />
              </div>
            ))}
          </Carousel>
        )}

        {completed.projects.length > 0 && (
          <Carousel title="Завершённые" href="/catalog?sort=popular&status=completed">
            {completed.projects.map((p) => (
              <div key={p.id} className="shrink-0 w-[160px]" style={{ scrollSnapAlign: 'start' }}>
                <ProjectCard project={p} size="sm" />
              </div>
            ))}
          </Carousel>
        )}
      </div>
    </div>
  );
}