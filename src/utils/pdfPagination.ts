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

/** Use line geometry instead of white pixels: tinted paper works identically. */
export function paginateResume(height: number, pageHeight: number, blocks: PageBlock[], lines: PageBlock[]): { start: number; end: number }[] {
  if (!Number.isFinite(height) || height < 0 || !Number.isFinite(pageHeight) || pageHeight < 1) throw new Error("无效的分页尺寸");
  const pages: { start: number; end: number }[] = [];
  let start = 0;
  while (start < height) {
    const target = Math.min(start + pageHeight, height);
    let end = target;
    if (target < height) {
      end = keepBlocksTogether(target, start, pageHeight, blocks);
      // Multiple columns can have overlapping lines. Resolve all crossings.
      for (let step = 0; step <= lines.length; step += 1) {
        const crossing = lines.filter(line => Number.isFinite(line.top) && Number.isFinite(line.bottom)
          && line.top < end && line.bottom > end && line.top > start + 1
          && line.bottom - line.top < pageHeight);
        if (!crossing.length) break;
        end = Math.max(start + 1, Math.floor(Math.min(...crossing.map(line => line.top)) - 1));
      }
    }
    if (end <= start) end = target;
    pages.push({ start, end });
    start = end;
  }
  return pages.length ? pages : [{ start: 0, end: 0 }];
}
