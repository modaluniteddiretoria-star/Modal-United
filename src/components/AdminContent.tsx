import { Plus, Trash2 } from "lucide-react";
import type { SiteContent, StatItem, Testimonial } from "../lib/data";

const field =
  "w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-sm text-cream-100 outline-none focus:border-gold-400/60";
const MAX_STATS = 4;
const MAX_TESTIMONIALS = 6;

function Card({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-cream-100/10 bg-ink-950/40 p-5">
      <h4 className="font-display text-xl text-cream-50">{title}</h4>
      <p className="mt-1 text-xs text-cream-500">{hint}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

// Aba "Conteúdo" do painel: textos e números exibidos no site
export function AdminContent({
  content,
  onChange,
}: {
  content: SiteContent;
  onChange: (next: SiteContent) => void;
}) {
  const setStat = (i: number, patch: Partial<StatItem>) =>
    onChange({ ...content, stats: content.stats.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const setTestimonial = (i: number, patch: Partial<Testimonial>) =>
    onChange({
      ...content,
      testimonials: content.testimonials.map((t, k) => (k === i ? { ...t, ...patch } : t)),
    });
  const setAbout = (patch: Partial<SiteContent["about"]>) =>
    onChange({ ...content, about: { ...content.about, ...patch } });

  return (
    <div className="space-y-6">
      <p className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-cream-200">
        Use apenas informações reais. O que ficar vazio não aparece no site (por exemplo, sem depoimentos a seção
        e o link do menu somem).
      </p>

      <Card
        title="Números em destaque"
        hint="Até 4. Os 3 primeiros aparecem no topo do site; todos aparecem na faixa de números. Ex.: “120+” / “imóveis vendidos”."
      >
        {content.stats.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              value={s.value}
              onChange={(e) => setStat(i, { value: e.target.value.slice(0, 20) })}
              placeholder="Valor (ex.: 120+)"
              aria-label={`Valor do número ${i + 1}`}
              className={`${field} w-36 flex-none`}
            />
            <input
              value={s.label}
              onChange={(e) => setStat(i, { label: e.target.value.slice(0, 40) })}
              placeholder="Descrição (ex.: imóveis vendidos)"
              aria-label={`Descrição do número ${i + 1}`}
              className={`${field} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => onChange({ ...content, stats: content.stats.filter((_, k) => k !== i) })}
              className="grid h-11 w-11 place-items-center rounded-full border border-red-500/40 text-red-200 hover:border-red-400"
              aria-label="Remover número"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {content.stats.length < MAX_STATS && (
          <button
            type="button"
            onClick={() => onChange({ ...content, stats: [...content.stats, { value: "", label: "" }] })}
            className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-4 py-2 text-sm font-bold text-gold-300 hover:bg-gold-500/10"
          >
            <Plus className="h-4 w-4" /> Adicionar número
          </button>
        )}
      </Card>

      <Card title="Sobre o corretor" hint="Textos da seção “Sobre o corretor”.">
        <label className="block space-y-2 text-sm text-cream-300">
          <span>Apresentação</span>
          <textarea
            value={content.about.description}
            onChange={(e) => setAbout({ description: e.target.value.slice(0, 800) })}
            rows={4}
            className={field}
          />
        </label>
        <label className="block space-y-2 text-sm text-cream-300">
          <span>Formação / certificações (opcional)</span>
          <input
            value={content.about.education}
            onChange={(e) => setAbout({ education: e.target.value.slice(0, 160) })}
            placeholder="Ex.: Técnico em Transações Imobiliárias"
            className={field}
          />
        </label>
        <label className="block space-y-2 text-sm text-cream-300">
          <span>Frase em destaque (opcional)</span>
          <input
            value={content.about.quote}
            onChange={(e) => setAbout({ quote: e.target.value.slice(0, 300) })}
            placeholder="Uma frase sua sobre como você trabalha"
            className={field}
          />
        </label>
      </Card>

      <Card title="Endereço" hint="Aparece no rodapé, acima da cidade. Pode usar mais de uma linha.">
        <textarea
          value={content.address}
          onChange={(e) => onChange({ ...content, address: e.target.value.slice(0, 200) })}
          rows={2}
          placeholder="Ex.: Rua Exemplo, 123 · Sala 4"
          aria-label="Endereço"
          className={field}
        />
      </Card>

      <Card title="Depoimentos" hint="Até 6, de clientes reais (com autorização deles).">
        {content.testimonials.map((t, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-cream-100/10 p-3">
            <div className="flex flex-wrap gap-2">
              <input
                value={t.name}
                onChange={(e) => setTestimonial(i, { name: e.target.value.slice(0, 80) })}
                placeholder="Nome do cliente"
                aria-label={`Nome do depoimento ${i + 1}`}
                className={`${field} min-w-0 flex-1`}
              />
              <input
                value={t.role}
                onChange={(e) => setTestimonial(i, { role: e.target.value.slice(0, 80) })}
                placeholder="Ex.: Comprou um apartamento em Moema"
                aria-label={`Descrição do depoimento ${i + 1}`}
                className={`${field} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() =>
                  onChange({ ...content, testimonials: content.testimonials.filter((_, k) => k !== i) })
                }
                className="grid h-11 w-11 place-items-center rounded-full border border-red-500/40 text-red-200 hover:border-red-400"
                aria-label="Remover depoimento"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={t.quote}
              onChange={(e) => setTestimonial(i, { quote: e.target.value.slice(0, 600) })}
              rows={3}
              placeholder="O que o cliente disse"
              aria-label={`Texto do depoimento ${i + 1}`}
              className={field}
            />
          </div>
        ))}
        {content.testimonials.length < MAX_TESTIMONIALS && (
          <button
            type="button"
            onClick={() =>
              onChange({ ...content, testimonials: [...content.testimonials, { name: "", role: "", quote: "" }] })
            }
            className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-4 py-2 text-sm font-bold text-gold-300 hover:bg-gold-500/10"
          >
            <Plus className="h-4 w-4" /> Adicionar depoimento
          </button>
        )}
      </Card>
    </div>
  );
}
