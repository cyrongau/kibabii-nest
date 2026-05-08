'use client';
import { useParams } from 'next/navigation';
export default function DynamicTest() {
  const { id } = useParams();
  return <div>Dynamic ID: {id}</div>
}
