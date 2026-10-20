import Link from 'next/link';
import { CATEGORY_META, STATUS_LABEL, cartridgeCount, type Cartridge } from '@/lib/catalog';
import { cartridgePalette, cleanList, groupByCategory, projectHref } from './content';
import PixelArt from './PixelArt';
import { ARROW_RIGHT, CARTRIDGE } from './sprites';
import b from './booklet.module.css';
import n from './notice.module.css';

interface CartridgesPageProps {
  cartridges: Cartridge[];
}

/** Rubrique « Les cartouches » : tous les projets, groupés par catégorie, en liste dense. */
export default function CartridgesPage({ cartridges }: CartridgesPageProps) {
  const groups = groupByCategory(cartridges);

  return (
    <section
      id="cartouches"
      aria-labelledby="cartouches-titre"
      className={`${b.sheet} ${n.anchor}`}
    >
      <div className={b.rubric}>
        <h2 id="cartouches-titre" className={b.rubricTitle}>
          Les cartouches
        </h2>
        <p className={b.rubricMeta}>
          {cartridgeCount(cartridges.length)}
        </p>
      </div>

      {cartridges.length === 0 ? (
        <p className={n.empty}>
          La ludothèque est vide pour le moment : les cartouches arrivent bientôt.
        </p>
      ) : (
        <>
          <p className={n.intro}>
            Chaque cartouche est un projet réel. Pour chacun : le rôle de Théo, la
            période, la stack et quelques chiffres datés. Le titre ouvre la fiche
            complète, qu&apos;on peut aussi insérer dans la console.
          </p>

          <div className={n.groups}>
            {groups.map((group) => (
              <CartridgeGroup
                key={group.category}
                category={group.category}
                items={group.items}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function CartridgeGroup({
  category,
  items,
}: {
  category: Cartridge['category'];
  items: Cartridge[];
}) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.web;
  const titleId = `categorie-${category}`;

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId} className={n.groupTitle}>
        <PixelArt rows={CARTRIDGE} palette={cartridgePalette(category)} pixel="3px" />
        <span className={n.groupName}>{meta.name}</span>{' '}
        <span className={n.groupCount}>
          {cartridgeCount(items.length)}
        </span>
      </h3>
      <ul className={n.cartList}>
        {items.map((cartridge) => (
          <CartridgeRow key={cartridge.id} cartridge={cartridge} />
        ))}
      </ul>
    </section>
  );
}

function CartridgeRow({ cartridge }: { cartridge: Cartridge }) {
  const technologies = cleanList(cartridge.technologies);
  // Deux chiffres suffisent dans la liste ; la fiche complète les donne tous.
  const stats = (cartridge.stats ?? [])
    .filter((stat) => stat?.label && stat?.value)
    .slice(0, 2);

  return (
    <li className={n.cartRow}>
      <div>
        <h4 className={n.cartTitle}>
          <Link href={projectHref(cartridge.id)} className={n.cartLink}>
            {cartridge.title}
            <PixelArt
              rows={ARROW_RIGHT}
              palette={{ '#': 'currentColor' }}
              pixel="0.1em"
              className={`${b.icon} ${n.cartArrow}`}
            />
          </Link>
        </h4>
        <p className={n.cartWhen}>
          <span className={b.status} data-status={cartridge.status}>
            {STATUS_LABEL[cartridge.status] ?? STATUS_LABEL.termine}
          </span>
          {cartridge.period ? <span>{cartridge.period}</span> : null}
        </p>
      </div>

      <div>
        {cartridge.tagline ? <p className={n.tagline}>{cartridge.tagline}</p> : null}
        {cartridge.role || stats.length > 0 || technologies.length > 0 ? (
          <dl className={n.cartFacts}>
            {cartridge.role ? (
              <div className={n.cartFact}>
                <dt className={n.cartFactKey}>Rôle</dt>
                <dd className={`${n.cartFactValue} ${n.cartRole}`}>{cartridge.role}</dd>
              </div>
            ) : null}
            {stats.length > 0 ? (
              <div className={n.cartFact}>
                <dt className={n.cartFactKey}>Chiffres</dt>
                <dd className={n.cartFactValue}>
                  <ul className={n.cartStats}>
                    {stats.map((stat, index) => (
                      <li key={`${index}-${stat.label}`}>
                        {stat.label} : <strong className={n.cartStatValue}>{stat.value}</strong>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
            {technologies.length > 0 ? (
              <div className={n.cartFact}>
                <dt className={n.cartFactKey}>Stack</dt>
                <dd className={n.cartFactValue}>
                  <ul className={b.inlineList}>
                    {technologies.map((tech, index) => (
                      <li key={`${index}-${tech}`}>{tech}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </li>
  );
}
