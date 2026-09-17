'use strict';
// A hint is shown only for a table that actually extends beyond its region.
const tableRegions = [...document.querySelectorAll('.table-scroll')];
const tableHints = tableRegions.map((region, index) => {
  const hint = document.createElement('p');
  hint.className = 'table-scroll-hint note';
  hint.id = 'table-scroll-hint-' + index;
  hint.textContent = 'Scroll sideways to see all columns. With a keyboard, focus the table area and use the arrow keys.';
  hint.hidden = true;
  region.before(hint);
  return hint;
});
function updateTableHints() {
  tableRegions.forEach((region, index) => {
    const overflow = region.scrollWidth > region.clientWidth + 1;
    tableHints[index].hidden = !overflow;
    if (overflow) region.setAttribute('aria-describedby', tableHints[index].id);
    else region.removeAttribute('aria-describedby');
  });
}
updateTableHints();
addEventListener('resize', updateTableHints);
if (typeof ResizeObserver !== 'undefined') {
  const tableObserver = new ResizeObserver(updateTableHints);
  tableRegions.forEach(region => tableObserver.observe(region));
}
