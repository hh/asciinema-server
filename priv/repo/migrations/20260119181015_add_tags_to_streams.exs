defmodule Asciinema.Repo.Migrations.AddTagsToStreams do
  use Ecto.Migration

  def change do
    alter table(:streams) do
      add :tags, {:array, :string}, default: []
    end

    execute(
      "CREATE INDEX streams_tags_index ON streams USING GIN(tags)",
      "DROP INDEX streams_tags_index"
    )
  end
end
