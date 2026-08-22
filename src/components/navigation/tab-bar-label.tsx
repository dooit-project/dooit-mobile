import { AppText } from '@/components/ui';

type TabBarLabelProps = {
  focused: boolean;
  label: string;
};

export function TabBarLabel({ focused, label }: TabBarLabelProps) {
  return (
    <AppText
      accessible={false}
      numberOfLines={1}
      tone={focused ? 'primary' : 'muted'}
      variant="caption"
      weight={focused ? 'bold' : 'medium'}
    >
      {label}
    </AppText>
  );
}
