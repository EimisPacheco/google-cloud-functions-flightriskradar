from google.cloud import bigquery

def upload_csv_to_bq(
    csv_file_path,
    project_id="crafty-cairn-469222-a8",
    dataset_id="airline_data",
    table_id="flights_2018",
    location="us-central1",
    skip_header=True,
    autodetect=True
):
    client = bigquery.Client(project=project_id, location=location)

    dataset_ref = client.dataset(dataset_id)
    table_ref = dataset_ref.table(table_id)

    job_config = bigquery.LoadJobConfig()
    job_config.source_format = bigquery.SourceFormat.CSV
    job_config.skip_leading_rows = 1 if skip_header else 0
    job_config.autodetect = autodetect
    # job_config.schema = [...]  # optional explicit schema

    with open(csv_file_path, "rb") as source_file:
        load_job = client.load_table_from_file(
            source_file,
            table_ref,
            job_config=job_config
        )

    print(f"Starting job {load_job.job_id}")
    load_job.result()  # wait for the job to complete

    destination = client.get_table(table_ref)
    print(
        f"Loaded {destination.num_rows} rows into "
        f"{project_id}:{dataset_id}.{table_id}"
    )

if __name__ == "__main__":
    upload_csv_to_bq(
        csv_file_path="/Users/eimis/Documents/HACKTHONS-2025/GOOGLE-AI-IN-ACTION/GFlightRiskRadar/project/2018.csv" # change to your file path
    )
