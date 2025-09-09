import { Music } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner = ({ size = 'md', text = 'Carregando...' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Music className={`${sizeClasses[size]} animate-neon-pulse text-primary mb-4`} />
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
};

export default LoadingSpinner;