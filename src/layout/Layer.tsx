import React from 'react';
import {Sequence} from 'remotion';

/**
 * A named, full-frame layer. `Sequence`'s default layout ('absolute-fill')
 * already applies position:absolute + inset:0 and accepts `style` directly —
 * so this IS the layer, not a wrapper around one. Nesting an `AbsoluteFill`
 * inside it (an earlier version of this file did) creates a second,
 * unavoidably generic "<AbsoluteFill>" row in the Studio timeline under the
 * named one. Using Sequence alone is what actually removes it.
 */
export const Layer: React.FC<{
  name: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({name, style, children}) => (
  <Sequence name={name} style={style}>
    {children}
  </Sequence>
);
