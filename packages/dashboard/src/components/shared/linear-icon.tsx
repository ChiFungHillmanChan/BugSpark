interface LinearIconProps {
  className?: string;
}

export function LinearIcon({ className }: LinearIconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <path d="M1.22541 61.5228c-.97401-1.6679-.97401-3.6327 0-5.3006L21.8654 20.0194c.974-1.6679 2.7752-2.6958 4.7232-2.6958h41.2796c1.948 0 3.7492 1.0279 4.7232 2.6958l20.64 36.2028c.974 1.6679.974 3.6327 0 5.3006l-20.64 36.2028c-.974 1.6679-2.7752 2.6958-4.7232 2.6958H26.5765c-1.948 0-3.7492-1.0279-4.7232-2.6958L1.22541 61.5228Z" />
    </svg>
  );
}
