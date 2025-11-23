type Props = {
  name: Promise<string>;
};

export default async function AsyncHello({ name }: Props) {
  const resolvedName = await name;
  return <div>Hello {resolvedName}</div>;
}
