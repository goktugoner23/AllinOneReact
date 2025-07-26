package com.example.allinone.adapters

import android.net.Uri
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.allinone.data.Investment
import com.example.allinone.databinding.ItemInvestmentBinding
import java.text.SimpleDateFormat
import java.util.Locale
import com.example.allinone.utils.NumberFormatUtils
import android.graphics.ImageDecoder
import com.bumptech.glide.Glide

class InvestmentAdapter(
    private val onItemClick: (Investment) -> Unit,
    private val onItemLongClick: (Investment) -> Unit,
    private val onImageClick: (Uri) -> Unit
) : ListAdapter<Investment, InvestmentAdapter.InvestmentViewHolder>(InvestmentDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): InvestmentViewHolder {
        val binding = ItemInvestmentBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return InvestmentViewHolder(binding)
    }

    override fun onBindViewHolder(holder: InvestmentViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class InvestmentViewHolder(
        private val binding: ItemInvestmentBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        private val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())

        init {
            binding.root.setOnClickListener {
                val position = bindingAdapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemClick(getItem(position))
                }
            }

            binding.root.setOnLongClickListener {
                val position = bindingAdapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemLongClick(getItem(position))
                }
                true
            }
        }

        fun bind(investment: Investment) {
            binding.apply {
                investmentName.text = investment.name
                investmentType.text = investment.type
                investmentAmount.text = "Initial: ${NumberFormatUtils.formatAmount(investment.amount)}"
                investmentDate.text = dateFormat.format(investment.date)
                investmentDescription.text = investment.description

                // Display current value
                investmentCurrentValue.text = "Current: ${NumberFormatUtils.formatAmount(investment.currentValue)}"

                // Display profit/loss with appropriate color
                when {
                    investment.profitLoss > 0 -> {
                        investmentProfitLoss.text = "Profit: +${NumberFormatUtils.formatAmount(investment.profitLoss)}"
                        investmentProfitLoss.setTextColor(ContextCompat.getColor(itemView.context, android.R.color.holo_green_dark))
                    }
                    investment.profitLoss < 0 -> {
                        investmentProfitLoss.text = "Loss: ${NumberFormatUtils.formatAmount(investment.profitLoss)}"
                        investmentProfitLoss.setTextColor(ContextCompat.getColor(itemView.context, android.R.color.holo_red_dark))
                    }
                    else -> {
                        investmentProfitLoss.text = "P/L: ${NumberFormatUtils.formatAmount(investment.profitLoss)}"
                        investmentProfitLoss.setTextColor(ContextCompat.getColor(itemView.context, android.R.color.darker_gray))
                    }
                }

                // Clear previous images
                imageContainer.removeAllViews()

                // Safely load images
                investment.imageUri?.split(",")?.forEach { uriString ->
                    try {
                        val uri = Uri.parse(uriString)
                        val imageView = ImageView(itemView.context).apply {
                            layoutParams = ViewGroup.LayoutParams(200, 200)
                            scaleType = ImageView.ScaleType.CENTER_CROP
                            setPadding(4, 4, 4, 4)
                            setOnClickListener { onImageClick(uri) }
                        }

                        Glide.with(itemView.context)
                            .load(uri)
                            .into(imageView)

                        imageContainer.addView(imageView)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }

    private class InvestmentDiffCallback : DiffUtil.ItemCallback<Investment>() {
        override fun areItemsTheSame(oldItem: Investment, newItem: Investment): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Investment, newItem: Investment): Boolean {
            return oldItem == newItem
        }
    }
}