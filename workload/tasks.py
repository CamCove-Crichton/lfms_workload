from celery import shared_task
from collections import defaultdict
from .utils import (
    fetch_workload_data,
    parse_datetime_safe,
    parse_decimal_safe,
    get_previous_updated_at,
    assign_tags,
    calculate_working_days,
    set_opp_date_and_time_out,
    create_start_build_date,
    update_model_with_history
)
from .models import (
    Owner,
    Client,
    Opportunity,
    Venue,
    ScenicCalcItems,
    ScenicCalcItem,
    ScenicCalcTotal,
    ActiveProducts,
    CustomInput
)
from django_celery_results.models import TaskResult
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta, datetime
from django.db.models import Sum, F
import logging

logger = logging.getLogger(__name__)

@shared_task(name='fetch_workshop_workload_task')
def fetch_workshop_workload(days):
    """Celery task to fetch workload data asynchronously."""
    logger.info(f"Running Celery Task with days={days}")
    data = fetch_workload_data(days=days)
    
    opportunities = data.get("opportunities_with_items", [])
    print(f"Total Opportunities: {len(opportunities)}")

    active_products = data.get("active_products")
    print(f"Total Active Products: {len(active_products)}")

    for ap in active_products:
        active_product, _ = ActiveProducts.objects.update_or_create(
            current_id=ap["id"],
            defaults={
                "name": ap.get("name"),
                "product_type": ap.get("type"),
                "description": ap.get("description")
            }
        )
    
    logger.info("Finished processing active products.")

    for opp_data in opportunities:
        opportunity_data = opp_data.get("opportunity")
        items = opp_data.get("items", [])
        owner_data = opportunity_data.get("owner")
        client_data = opportunity_data.get("member")

        # Owner
        try:
            owner, _ = Owner.objects.update_or_create(
                current_id=owner_data["id"],
                defaults={
                    "current_uuid": owner_data["uuid"],
                    "name": owner_data["name"],
                    "active": owner_data["active"],
                    "bookable": owner_data["bookable"],
                    "membership_id": owner_data["membership_id"],
                    "membership_type": owner_data["membership_type"],
                    "lawful_basis_id": owner_data["lawful_basis_type_id"],
                    "lawful_basis_type_name": owner_data["lawful_basis_type_name"],
                },
            )
            assign_tags(owner, owner_data.get("tag_list", []))
        except Exception as e:
            logger.error(f"Failed to create owner {owner_data['id']}: {e}")
            continue

        # Client
        try:
            client, _ = Client.objects.update_or_create(
                current_id=client_data["id"],
                defaults={
                    "current_uuid": client_data["uuid"],
                    "name": client_data["name"],
                    "description": client_data.get("description", ""),
                    "active": client_data["active"],
                },
            )
            assign_tags(client, client_data.get("tag_list", []))
        except Exception as e:
            logger.error(f"Failed to create client {client_data['id']}: {e}")
            continue

        # Venue
        destination = opportunity_data.get("destination") or {}
        dest = destination.get("address") or {}
        venue = None
        if dest:
            venue, _ = Venue.objects.update_or_create(
                current_id=dest["id"],
                defaults={
                    "name": dest.get("name", ""),
                    "street": dest.get("street", ""),
                    "postcode": dest.get("postcode", ""),
                    "city": dest.get("city", ""),
                    "county": dest.get("county", ""),
                    "country": dest.get("country", ""),
                }
            )
        
        # Opportunity
        # old_opp = Opportunity.objects.filter(current_id=opportunity_data["id"]).first()
        # old_opp_name = old_opp.opportunity_name if old_opp else None
        # old_status_name = old_opp.status_name if old_opp else None
        # old_updated_at = old_opp.updated_at if old_opp else None
        # previous_updated_at_opp = get_previous_updated_at(Opportunity, {"current_id": opportunity_data["id"]})
        try:
            opportunity, created = update_model_with_history(
                model=Opportunity,
                lookup={"current_id": opportunity_data["id"]},
                defaults={
                    "owner": owner,
                    "client": client,
                    "order_number": opportunity_data.get("number", ""),
                    "opportunity_name": opportunity_data.get("subject", ""),
                    "dry_hire": opportunity_data["custom_fields"].get("dry_hire", ""),
                    "dry_hire_transport": opportunity_data["custom_fields"].get("dry_hire_transport", ""),
                    "status": opportunity_data.get("status", ""),
                    "status_name": opportunity_data.get("status_name", ""),
                    "starts_at": parse_datetime_safe(opportunity_data.get("starts_at")),
                    "ends_at": parse_datetime_safe(opportunity_data.get("ends_at")),
                    "load_starts_at": parse_datetime_safe(opportunity_data.get("load_starts_at")),
                    "load_ends_at": parse_datetime_safe(opportunity_data.get("load_ends_at")),
                    "deliver_starts_at": parse_datetime_safe(opportunity_data.get("deliver_starts_at")),
                    "deliver_ends_at": parse_datetime_safe(opportunity_data.get("deliver_ends_at")),
                    "setup_starts_at": parse_datetime_safe(opportunity_data.get("setup_starts_at")),
                    "setup_ends_at": parse_datetime_safe(opportunity_data.get("setup_ends_at")),
                    "show_starts_at": parse_datetime_safe(opportunity_data.get("show_starts_at")),
                    "show_ends_at": parse_datetime_safe(opportunity_data.get("show_ends_at")),
                    "takedown_starts_at": parse_datetime_safe(opportunity_data.get("takedown_starts_at")),
                    "takedown_ends_at": parse_datetime_safe(opportunity_data.get("takedown_ends_at")),
                    "collect_starts_at": parse_datetime_safe(opportunity_data.get("collect_starts_at")),
                    "collect_ends_at": parse_datetime_safe(opportunity_data.get("collect_ends_at")),
                    "unload_starts_at": parse_datetime_safe(opportunity_data.get("unload_starts_at")),
                    "unload_ends_at": parse_datetime_safe(opportunity_data.get("unload_ends_at")),
                    "weight_total": parse_decimal_safe(opportunity_data.get("weight_total")),
                    "venue": venue,
                },
                previous_fields=["opportunity_name", "status_name"],
            )

            # if not created:
            #     opportunity.previous_opportunity_name = old_opp_name
            #     opportunity.previous_status_name = old_status_name
            #     opportunity.previously_updated_at = old_updated_at
            
            assign_tags(opportunity, opportunity_data.get("tag_list", []))

            date_out, time_out = set_opp_date_and_time_out(opportunity_data)

            custom_input, created = update_model_with_history(
                model=CustomInput,
                lookup={"opportunity": opportunity},
                defaults={
                    "num_of_carpenters": 1,
                    "include_weekends": False,
                    "built": False,
                    "date_out": date_out,
                    "time_out": time_out,
                },
                previous_fields=["date_out", "time_out"]
            )

            # opportunity.save()

        except Exception as e:
            logger.error(f"Failed to create Opportunity {opportunity_data['id']}: {e}")
            continue

        item_totals = defaultdict(Decimal)
        item_names = {}

        for item in items:
            current_item_id = item["item_id"]
            name = item["name"].split('-')[0].strip()
            raw_qty = item.get("quantity")
            current_quantity = Decimal(raw_qty) / 2 if raw_qty is not None else Decimal(0)
            item_totals[current_item_id] += current_quantity
            item_names[current_item_id] = name
            existing_item = ScenicCalcItem.objects.filter(current_id=item["id"]).first()
            previous_quantity = existing_item.quantity if existing_item else None
            previous_updated_at_itm = get_previous_updated_at(ScenicCalcItem, {"current_id": item["id"]})

            # Scenic Calc Individual Items
            try:
                sci_item, created = ScenicCalcItem.objects.update_or_create(
                    current_id=item["id"],
                    defaults={
                        "opportunity_id": item.get("opportunity_id"),
                        "current_item_id": item.get("item_id"),
                        "current_item_type": item.get("item_type", ""),
                        "opportunity_item_type": item.get("opportunity_item_type"),
                        "opportunity_item_type_name": item.get("opportunity_item_type_name", ""),
                        "name": name,
                        "quantity": current_quantity,
                        "previous_quantity": previous_quantity if previous_quantity and previous_quantity != current_quantity else current_quantity,
                        "description": item.get("description", ""),
                        "previously_updated_at": previous_updated_at_itm
                    },
                )
            except Exception as e:
                logger.error(f"Failed to create ScenicCalcItem for {item['id']}: {e}")
                continue
        
        grand_total = Decimal(0)

        for current_item_id, total_qty in item_totals.items():
            name = item_names[current_item_id]
            is_valid_item = (
                current_item_id != 4977
                and ActiveProducts.objects.filter(current_id=current_item_id).exists()
            )
            if not is_valid_item:
                continue

            # Scenic Calc Item totals
            sci, _ = ScenicCalcItems.objects.get_or_create(
                opportunity=opportunity,
                current_item_id=current_item_id,
                defaults={
                    "name": name,
                    "item_total": total_qty,
                },
            )

            last_updated_at = sci.updated_at
            sci.previous_item_total = sci.item_total
            sci.item_total = total_qty

            if not created:
                sci.previously_updated_at = last_updated_at

            sci.save()
            grand_total += total_qty
        
        # Grand totals
        # old_total = ScenicCalcTotal.objects.filter(opportunity=opportunity).first()
        # old_grand_total = old_total.grand_total if old_total else None
        # old_updated_at = old_total.updated_at if old_total else None

        scenic_total, created = update_model_with_history(
            model=ScenicCalcTotal,
            lookup={"opportunity": opportunity},
            defaults={"grand_total": grand_total},
            previous_fields=["grand_total"],
        )

        # if not created:
        #     scenic_total.previous_grand_total = old_grand_total
        #     scenic_total.previously_updated_at = old_updated_at

        # scenic_total.save()

        custom_input = CustomInput.objects.filter(opportunity=opportunity).first()
        if custom_input and date_out:
            num_of_carpenters = custom_input.num_of_carpenters or 1
            working_days = calculate_working_days(grand_total, num_of_carpenters)
            if custom_input.planned_finish_date:
                start_build_date = create_start_build_date(
                    working_days=working_days or 0,
                    date_out=custom_input.planned_finish_date,
                    include_weekends=custom_input.include_weekends,
                    planned_finish=True
                )
            else:
                start_build_date = create_start_build_date(
                    working_days=working_days or 0,
                    date_out=date_out,
                    include_weekends=custom_input.include_weekends,
                    planned_finish=False
                )

            custom_input.working_days = Decimal(working_days)
            custom_input.start_build_date = start_build_date
            custom_input.save(update_fields=["working_days", "start_build_date"])

        logger.debug(f"Opportunity {opportunity.id} date_out={date_out}, time_out={time_out}, start_build_date={start_build_date}")

        logger.info(
            f"Processed Opportunity: {opportunity.opportunity_name} ({opportunity.current_id}) "
            f"({opportunity.current_id}) - Grand Total: {grand_total}, "
            f"Working Days: {working_days if custom_input else 'N/A'}"
        )
        logger.info(f"Items added: {len(items)}")

    print(f"Saving {len(opportunities)} opportunities")
    logger.info("Finished processing opportunities.")

    return {
        "status": "completed",
        "opportunities_processed": len(opportunities),
        "products_processed": len(active_products)
    }


@shared_task
def delete_old_task_results():
    cutoff = timezone.now() - timedelta(hours=12)
    deleted_count, _ = TaskResult.objects.filter(date_done__lt=cutoff).delete()
    return f"Deleted {deleted_count} old task results"


@shared_task
def test_celery_task():
    logger.info("✅ Celery task ran successfully.")
    print("✅ Celery task ran successfully.")
    return "Task completed"
