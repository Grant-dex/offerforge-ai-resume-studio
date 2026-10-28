export interface PageBlock { top: number; bottom: number }

/** Keep short entries and headings together, but let long entries flow across pages. */
export function keepBlocksTogether(target: number, pageStart: number, pageHeight: number, blocks: PageBlock[]): number {
  const earliest = pageStart + pageHeight * 0.5;
  let boundary = target;
  for (let step = 0; step < blocks.length; step += 1) {
    const crossing = blocks.filter(block =>
      Number.isFinite(block.top) && Number.isFinite(block.bottom) && block.bottom > block.top
      && block.top > earliest && block.top < boundary && block.bottom > boundary
      && block.bottom - block.top <= pageHeight * 0.5
    );
    if (!crossing.length) break;
    boundary = Math.min(...crossing.map(block => block.top));
  }
  return Math.floor(boundary);
}
