defmodule Asciinema.Workers.DeleteOldDvrRecordings do
  @moduledoc """
  Oban worker that cleans up old DVR recording files.

  DVR files are kept in `uploads/live/` directory during and after streaming
  to enable time-shifted playback. This worker removes files older than
  the configured retention period (default: 7 days).
  """

  use Oban.Worker,
    unique: [period: :infinity, states: :incomplete]

  require Logger

  @default_retention_days 7

  @impl Oban.Worker
  def perform(_job) do
    retention_days = Application.get_env(:asciinema, :dvr_retention_days, @default_retention_days)
    cutoff = DateTime.add(DateTime.utc_now(), -retention_days, :day)

    count = delete_old_dvr_files(cutoff)

    if count > 0 do
      Logger.info("deleted #{count} DVR recording(s) older than #{retention_days} days")
    end

    :ok
  end

  defp delete_old_dvr_files(cutoff) do
    live_dir =
      Path.join([
        Application.get_env(:asciinema, :uploads_path, "uploads"),
        "live"
      ])

    case File.ls(live_dir) do
      {:ok, files} ->
        files
        |> Enum.filter(&String.ends_with?(&1, ".cast"))
        |> Enum.map(&Path.join(live_dir, &1))
        |> Enum.filter(&file_older_than?(&1, cutoff))
        |> Enum.map(&delete_file/1)
        |> Enum.count(& &1)

      {:error, :enoent} ->
        # Directory doesn't exist yet, nothing to clean
        0

      {:error, reason} ->
        Logger.warning("failed to list DVR directory #{live_dir}: #{reason}")
        0
    end
  end

  defp file_older_than?(path, cutoff) do
    case File.stat(path, time: :posix) do
      {:ok, %{mtime: mtime}} ->
        file_time = DateTime.from_unix!(mtime)
        DateTime.compare(file_time, cutoff) == :lt

      {:error, _} ->
        false
    end
  end

  defp delete_file(path) do
    case File.rm(path) do
      :ok ->
        Logger.debug("deleted DVR file: #{path}")
        true

      {:error, reason} ->
        Logger.warning("failed to delete DVR file #{path}: #{reason}")
        false
    end
  end
end
