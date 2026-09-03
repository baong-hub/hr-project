import * as LucideIcons from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: string | number;
  color?: string;
  strokeWidth?: string | number;
}

export const Icon = ({ name, size = 24, color = 'currentColor', strokeWidth = 2, ...props }: IconProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} {...props} />;
};
