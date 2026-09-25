import React from 'react';
import {Sequence} from 'remotion';

// A named, full-frame layer. `Sequence` already lays out as an absolute fill and
// accepts `style`, so this is the layer itself, and it shows up in the Studio
// timeline under its name instead of as an anonymous <AbsoluteFill> row.
export const Layer: React.FC<{name: string; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  name,
  style,
  children,
}) => (
  <Sequence name={name} style={style}>
    {children}
  </Sequence>
);
