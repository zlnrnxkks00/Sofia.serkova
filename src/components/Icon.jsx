import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  MapPin,
  Menu,
  Phone,
  Plus,
  X,
} from "lucide-react";

const icons = {
  "arrow-up-right": ArrowUpRight,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "clock-3": Clock3,
  info: Info,
  "map-pin": MapPin,
  menu: Menu,
  phone: Phone,
  plus: Plus,
  x: X,
};

export function Icon({ name, ...props }) {
  const Component = icons[name];
  return <Component {...props} />;
}
