import { useState } from 'react';
import { getInitials } from '@/shared/lib/format';
import { getUploadUrl } from '@/shared/lib/uploads';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  src?: string | null;
  className?: string;
  rounded?: 'full' | 'xl';
  title?: string;
}

export function Avatar({
  firstName,
  lastName,
  src,
  className = 'h-10 w-10 text-label-md',
  rounded = 'full',
  title,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : getUploadUrl(src);

  return (
    <div
      title={title}
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-primary-container font-bold text-on-primary-container ${
        rounded === 'full' ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        getInitials(firstName, lastName)
      )}
    </div>
  );
}
