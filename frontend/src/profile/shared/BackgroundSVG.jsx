import React from 'react';

const BackgroundSVG = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="880" height="520" viewBox="0 0 880 520" fill="none">
      <foreignObject x="-4" y="-4" width="888" height="528">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{backdropFilter: 'blur(2px)', clipPath: 'url(#bgblur_0_646_878_clip_path)', height: '100%', width: '100%'}} />
      </foreignObject>
      <g data-figma-bg-blur-radius="4">
        <mask id="path-1-inside-1_646_878" fill="white">
          <path fillRule="evenodd" clipRule="evenodd" d="M880 40C880 17.9086 862.091 0 840 0H490C467.909 0 450 17.9086 450 40V230C450 252.091 432.091 270 410 270H40C17.9086 270 0 287.909 0 310V480C0 502.091 17.9086 520 40 520H840C862.091 520 880 502.091 880 480V270V40Z" />
        </mask>
        <path fillRule="evenodd" clipRule="evenodd" d="M880 40C880 17.9086 862.091 0 840 0H490C467.909 0 450 17.9086 450 40V230C450 252.091 432.091 270 410 270H40C17.9086 270 0 287.909 0 310V480C0 502.091 17.9086 520 40 520H840C862.091 520 880 502.091 880 480V270V40Z" fill="#1F1F1F" fillOpacity="0.6" />
        <path d="M490 1H840V-1H490V1ZM451 230V40H449V230H451ZM40 271H410V269H40V271ZM1 480V310H-1V480H1ZM840 519H40V521H840V519ZM879 270V480H881V270H879ZM879 40V270H881V40H879ZM840 521C862.644 521 881 502.644 881 480H879C879 501.539 861.539 519 840 519V521ZM-1 480C-1 502.644 17.3563 521 40 521V519C18.4609 519 1 501.539 1 480H-1ZM40 269C17.3563 269 -1 287.356 -1 310H1C1 288.461 18.4609 271 40 271V269ZM449 230C449 251.539 431.539 269 410 269V271C432.644 271 451 252.644 451 230H449ZM840 1C861.539 1 879 18.4609 879 40H881C881 17.3563 862.644 -1 840 -1V1ZM490 -1C467.356 -1 449 17.3563 449 40H451C451 18.4609 468.461 1 490 1V-1Z" fill="#373737" mask="url(#path-1-inside-1_646_878)" />
      </g>
      <defs>
        <clipPath id="bgblur_0_646_878_clip_path" transform="translate(4 4)">
          <path fillRule="evenodd" clipRule="evenodd" d="M880 40C880 17.9086 862.091 0 840 0H490C467.909 0 450 17.9086 450 40V230C450 252.091 432.091 270 410 270H40C17.9086 270 0 287.909 0 310V480C0 502.091 17.9086 520 40 520H840C862.091 520 880 502.091 880 480V270V40Z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default BackgroundSVG;
