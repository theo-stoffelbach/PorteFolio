import { renderConsole } from '@/components/console/render/body';
import { BODY_IMAGE, type LayoutId } from '@/components/console/render/layout';
import { encodePng } from '@/components/console/render/png';

// Images du corps de la console, rendues au build avec le même moteur pixel que
// le canvas : la console s'affiche dès le premier rendu, avant le JavaScript ou sans lui.

export const dynamic = 'force-static';
export const dynamicParams = false;

const LAYOUT_BY_NAME = new Map<string, LayoutId>(
  (Object.entries(BODY_IMAGE) as [LayoutId, string][]).map(([layout, path]) => [
    path.slice(path.lastIndexOf('/') + 1),
    layout,
  ])
);

export function generateStaticParams() {
  return [...LAYOUT_BY_NAME.keys()].map((name) => ({ name }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const layout = LAYOUT_BY_NAME.get(name);
  if (!layout) return new Response('Image introuvable', { status: 404 });
  const png = encodePng(renderConsole(layout, {}));
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
