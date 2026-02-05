from django.contrib import admin
from django.db.models import Sum
from .models import (
    Opportunity, Tag, ScenicCalcItems, ScenicCalcItem,
    ScenicCalcTotal, CustomInput, Carpenters, Carpenter,
    ActiveProducts, Owner, Client, Venue
)


class ScenicCalcItemsInline(admin.TabularInline):
    model = ScenicCalcItems
    extra = 0
    fields = ("name", "item_total", "previous_item_total", "is_active")


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    inlines = [ScenicCalcItemsInline]
    readonly_fields = ("scenic_calc_totals", "created_at", "updated_at")

    fieldsets = (
        (None, {
            "fields": ("opportunity_name", "previous_opportunity_name", "current_id", "client", "venue", "owner", "order_number",
                       "status", "status_name", "previous_status_name", "dry_hire", "dry_hire_transport", "starts_at",
                       "ends_at", "load_starts_at", "deliver_starts_at", "setup_starts_at",
                       "show_starts_at", "takedown_starts_at", "collect_starts_at", "unload_starts_at",
                       "tags", "weight_total", "created_at", "updated_at", "previously_updated_at", "is_active")
        }),
        ("Scenic Totals", {
            "fields": ("scenic_calc_totals",),
        }),
    )

    def scenic_calc_totals(self, obj):
        totals_active = ScenicCalcItems.objects.filter(opportunity=obj).filter(is_active=True).aggregate(
            total=Sum("item_total"),
            prev_total=Sum("previous_item_total")
        )
        totals_all = ScenicCalcItems.objects.filter(opportunity=obj).aggregate(
            total=Sum("item_total"),
            prev_total=Sum("previous_item_total")
        )
        return f"Grand Total (Active Items Only): {totals_active['total'] or 0}, Grand Total (ALL): {totals_all['total'] or 0} | Previous Grand Total (Active Items Only): {totals_active['prev_total'] or 0}, Previous Grand Total (ALL): {totals_all['prev_total'] or 0}"
    
    scenic_calc_totals.short_description = "Scenic Calc Totals"


admin.site.register(Tag)
admin.site.register(ScenicCalcItems)
admin.site.register(ScenicCalcItem)
admin.site.register(CustomInput)
admin.site.register(Carpenters)
admin.site.register(Carpenter)
admin.site.register(ActiveProducts)
admin.site.register(Owner)
admin.site.register(Client)
admin.site.register(Venue)
admin.site.register(ScenicCalcTotal)
