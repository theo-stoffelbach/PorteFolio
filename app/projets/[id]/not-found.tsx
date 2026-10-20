import MissingSheet from '@/components/notice/MissingSheet';

export default function ProjectNotFound() {
  return (
    <MissingSheet title="Cartouche introuvable">
      <p>Aucune cartouche de la ludothèque ne porte ce nom.</p>
      <p>Elle a peut-être été retirée, ou le lien est mal recopié.</p>
    </MissingSheet>
  );
}
