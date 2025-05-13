import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  Tag, 
  Bell, 
  MessageSquare, 
  CheckCircle, 
  ShoppingCart, 
  Truck
} from 'lucide-react';
import { ActivityItem as ActivityItemType } from '@shared/types';

interface ActivityItemProps {
  item: ActivityItemType;
}

export default function ActivityItem({ item }: ActivityItemProps) {
  const getIcon = () => {
    switch (item.icon) {
      case 'check-circle':
        return <CheckCircle className={`h-8 w-8 text-${item.color}`} />;
      case 'clock':
        return <Clock className={`h-8 w-8 text-${item.color}`} />;
      case 'tag':
        return <Tag className={`h-8 w-8 text-${item.color}`} />;
      case 'bell':
        return <Bell className={`h-8 w-8 text-${item.color}`} />;
      case 'message-square':
        return <MessageSquare className={`h-8 w-8 text-${item.color}`} />;
      case 'shopping-cart':
        return <ShoppingCart className={`h-8 w-8 text-${item.color}`} />;
      case 'truck':
        return <Truck className={`h-8 w-8 text-${item.color}`} />;
      default:
        return <Bell className={`h-8 w-8 text-${item.color}`} />;
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-${item.color}/10`}>
        {getIcon()}
      </div>
      <div>
        <p className="text-sm font-medium leading-none">{item.title}</p>
        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}