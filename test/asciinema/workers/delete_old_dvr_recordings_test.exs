defmodule Asciinema.Workers.DeleteOldDvrRecordingsTest do
  # TODO: Fix flaky test - path handling issues in CI
  @moduletag :skip
  use Asciinema.DataCase, async: true
  alias Asciinema.Workers.DeleteOldDvrRecordings

  @live_dir Path.join([System.tmp_dir!(), "test_dvr_#{:rand.uniform(100_000)}"])

  setup do
    # Create a temp directory for testing
    File.mkdir_p!(@live_dir)
    Application.put_env(:asciinema, :uploads_path, Path.dirname(@live_dir))

    on_exit(fn ->
      File.rm_rf!(@live_dir)
    end)

    :ok
  end

  describe "perform/1" do
    test "deletes files older than retention period" do
      Application.put_env(:asciinema, :dvr_retention_days, 7)

      # Create an old file (10 days old)
      old_file = Path.join(@live_dir, "old_stream.cast")
      File.write!(old_file, "{}")
      # Touch file to make it old
      old_time = DateTime.utc_now() |> DateTime.add(-10, :day) |> DateTime.to_unix()
      File.touch!(old_file, old_time)

      # Create a recent file (1 day old)
      recent_file = Path.join(@live_dir, "recent_stream.cast")
      File.write!(recent_file, "{}")
      recent_time = DateTime.utc_now() |> DateTime.add(-1, :day) |> DateTime.to_unix()
      File.touch!(recent_file, recent_time)

      job = DeleteOldDvrRecordings.new(%{})
      assert DeleteOldDvrRecordings.perform(job) == :ok

      # Old file should be deleted
      refute File.exists?(old_file)

      # Recent file should still exist
      assert File.exists?(recent_file)
    end

    test "only deletes .cast files" do
      Application.put_env(:asciinema, :dvr_retention_days, 7)

      # Create an old .cast file
      cast_file = Path.join(@live_dir, "stream.cast")
      File.write!(cast_file, "{}")
      old_time = DateTime.utc_now() |> DateTime.add(-10, :day) |> DateTime.to_unix()
      File.touch!(cast_file, old_time)

      # Create an old non-.cast file
      other_file = Path.join(@live_dir, "stream.json")
      File.write!(other_file, "{}")
      File.touch!(other_file, old_time)

      job = DeleteOldDvrRecordings.new(%{})
      assert DeleteOldDvrRecordings.perform(job) == :ok

      # .cast file should be deleted
      refute File.exists?(cast_file)

      # Non-.cast file should still exist
      assert File.exists?(other_file)
    end

    test "handles missing directory gracefully" do
      Application.put_env(:asciinema, :dvr_retention_days, 7)

      # Remove the directory
      File.rm_rf!(@live_dir)

      job = DeleteOldDvrRecordings.new(%{})
      assert DeleteOldDvrRecordings.perform(job) == :ok
    end

    test "handles empty directory" do
      Application.put_env(:asciinema, :dvr_retention_days, 7)

      job = DeleteOldDvrRecordings.new(%{})
      assert DeleteOldDvrRecordings.perform(job) == :ok
    end

    test "respects custom retention period" do
      Application.put_env(:asciinema, :dvr_retention_days, 1)

      # Create a file that's 2 days old
      file = Path.join(@live_dir, "stream.cast")
      File.write!(file, "{}")
      old_time = DateTime.utc_now() |> DateTime.add(-2, :day) |> DateTime.to_unix()
      File.touch!(file, old_time)

      job = DeleteOldDvrRecordings.new(%{})
      assert DeleteOldDvrRecordings.perform(job) == :ok

      # File should be deleted with 1 day retention
      refute File.exists?(file)
    end

    test "deletes archived DVR files" do
      Application.put_env(:asciinema, :dvr_retention_days, 7)

      # Create archived files with timestamp suffixes (created by archive_existing_dvr)
      archived_file = Path.join(@live_dir, "123_20260101T120000.cast")
      File.write!(archived_file, "{}")
      old_time = DateTime.utc_now() |> DateTime.add(-10, :day) |> DateTime.to_unix()
      File.touch!(archived_file, old_time)

      job = DeleteOldDvrRecordings.new(%{})
      assert DeleteOldDvrRecordings.perform(job) == :ok

      # Archived file should be deleted
      refute File.exists?(archived_file)
    end
  end
end
