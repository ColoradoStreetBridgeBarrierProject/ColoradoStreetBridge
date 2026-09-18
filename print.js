'use strict';
// Print the supporting records, then restore the reader's disclosure choices.
(() => {
  let closedBeforePrint=null;
  addEventListener('beforeprint',()=>{
    if(closedBeforePrint)return;
    closedBeforePrint=[...document.querySelectorAll('details:not([open])')];
    closedBeforePrint.forEach(detail=>{detail.open=true;});
  });
  addEventListener('afterprint',()=>{
    if(!closedBeforePrint)return;
    closedBeforePrint.forEach(detail=>{detail.open=false;});
    closedBeforePrint=null;
  });
})();
