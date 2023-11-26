interface LinkProps {
  title: string;
  href: string;
}

export default function Link({ title, href }: LinkProps) {
  return (
    <a
      className="cursor-pointer text-gray-700 transition duration-300 ease-in hover:text-black"
      target="_blank"
      rel="noreferrer"
      href={href}
    >
      <p>{title}</p>
    </a>
  );
}
