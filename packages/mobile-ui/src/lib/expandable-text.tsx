import { useState } from 'react';
import { Text, View, type StyleProp, type TextStyle } from 'react-native';
import { Button } from './button.tsx';

/** Measure at the actual width and font scale; character counts cannot detect truncation. */
export function ExpandableText({
  text,
  style,
  expandLabel,
  collapseLabel,
  lines = 3,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  expandLabel: string;
  collapseLabel: string;
  lines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const truncated = collapsedHeight > 0 && fullHeight > collapsedHeight + 1;
  return (
    <View>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 0,
          overflow: 'hidden',
          opacity: 0,
        }}
      >
        <Text
          accessible={false}
          style={style}
          onLayout={(event) => setFullHeight(event.nativeEvent.layout.height)}
        >
          {text}
        </Text>
      </View>
      <Text
        style={style}
        numberOfLines={expanded ? undefined : lines}
        onLayout={(event) => {
          if (!expanded) setCollapsedHeight(event.nativeEvent.layout.height);
        }}
      >
        {text}
      </Text>
      {(truncated || expanded) && (
        <Button
          title={expanded ? 'Show less' : 'Read full review'}
          accessibilityLabel={expanded ? collapseLabel : expandLabel}
          variant="ghost"
          onPress={() => setExpanded((value) => !value)}
        />
      )}
    </View>
  );
}
